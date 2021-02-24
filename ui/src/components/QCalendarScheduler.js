// Vue
import {
  h,
  computed,
  defineComponent,
  getCurrentInstance,
  onBeforeUpdate,
  onMounted,
  nextTick,
  reactive,
  ref,
  Transition,
  watch,
  withDirectives
} from 'vue'

// Utility
import {
  getDayIdentifier,
  isBetweenDates,
  parsed,
  parseTimestamp,
  today
} from '../utils/Timestamp.js'

import {
  convertToUnit,
  minCharWidth
} from '../utils/helpers.js'

// Composables
import useCalendar from '../composables/useCalendar.js'
import useCommon, { useCommonProps } from '../composables/useCommon.js'
import useInterval, { useSchedulerProps } from '../composables/useInterval.js'
import { useColumnProps } from '../composables/useColumn.js'
import { useMaxDaysProps } from '../composables/useMaxDays.js'
import useTimes, { useTimesProps } from '../composables/useTimes.js'
import useRenderValues from '../composables/useRenderValues.js'
import useMouse, { getRawMouseEvents } from '../composables/useMouse.js'
import useMove, { useMoveEmits } from '../composables/useMove.js'
import useEmitListeners from '../composables/useEmitListeners.js'
import useButton from '../composables/useButton.js'
import useFocusHelper from '../composables/useFocusHelper.js'
import useCellWidth, { useCellWidthProps } from '../composables/useCellWidth.js'
import useCheckChange, { useCheckChangeEmits } from '../composables/useCheckChange.js'
import useEvents from '../composables/useEvents.js'
import useKeyboard, { useNavigationProps } from '../composables/useKeyboard.js'

// Directives
import ResizeObserver from '../directives/ResizeObserver.js'

export default defineComponent({
  name: 'QCalendarScheduler',

  directives: [ResizeObserver],

  props: {
    ...useCommonProps,
    ...useSchedulerProps,
    // ...useResourceProps,
    ...useColumnProps,
    ...useMaxDaysProps,
    ...useTimesProps,
    ...useCellWidthProps,
    ...useNavigationProps
  },

  emits: [
    'update:modelValue',
    'update:modelResources',
    'resource-expanded',
    ...useCheckChangeEmits,
    ...useMoveEmits,
    ...getRawMouseEvents('-date'),
    ...getRawMouseEvents('-day-resource'),
    ...getRawMouseEvents('-head-resources'),
    ...getRawMouseEvents('-head-day'),
    ...getRawMouseEvents('-resource')
  ],

  setup (props, { slots, emit, expose }) {
    const
      scrollArea = ref(null),
      pane = ref(null),
      headerRef = ref(null),
      headDaysColumnRef = ref(null),
      focusRef = ref(null),
      focusValue = ref(null),
      // resourceFocusRef = ref(null),
      // resourceFocusValue = ref(null),
      datesRef = ref({}),
      resourcesRef = ref({}),
      headDayEventsParentRef = ref({}),
      headDayEventsChildRef = ref({}),
      // resourcesHeadRef = ref(null),
      direction = ref('next'),
      startDate = ref(today()),
      endDate = ref('0000-00-00'),
      maxDaysRendered = ref(0),
      emittedValue = ref(props.modelValue),
      size = reactive({ width: 0, height: 0 }),
      dragOverHeadDayRef = ref(false),
      dragOverResource = ref(false),
      // keep track of last seen start and end dates
      lastStart = ref(null),
      lastEnd = ref(null)

    const parsedView = computed(() => {
      if (props.view === 'month') {
        return 'month-interval'
      }
      return props.view
    })

    const vm = getCurrentInstance()
    if (vm === null) {
      throw new Error('current instance is null')
    }

    const { emitListeners } = useEmitListeners(vm)

    const {
      isSticky
    } = useCellWidth(props)

    watch(isSticky, (val) => {
      console.log('isSticky', isSticky.value)
    })

    const {
      times,
      setCurrent,
      updateCurrent
    } = useTimes(props)

    // update dates
    updateCurrent()
    setCurrent()

    const {
      // computed
      weekdaySkips,
      parsedStart,
      parsedEnd,
      dayFormatter,
      weekdayFormatter,
      ariaDateFormatter,
      // methods
      dayStyleDefault,
      getRelativeClasses
    } = useCommon(props, { startDate, endDate, times })

    const parsedValue = computed(() => {
      return parseTimestamp(props.modelValue, times.now)
        || parsedStart.value
        || times.today
    })

    focusValue.value = parsedValue.value
    focusRef.value = parsedValue.value.date

    const canChangeDate = computed(() => {
      if (maxDaysRendered.value === 0) return true
      if (endDate.value === '0000-00-00') return true
      if (days.value === undefined || days.value.length === 0) return true
      const start = days.value[ 0 ]
      const end = days.value[ days.value.length - 1 ]
      return isBetweenDates(parsedValue.value, start, end) !== true
    })

    const { renderValues } = useRenderValues(props, {
      parsedView,
      times,
      parsedValue
    })

    const {
      rootRef,
      scrollWidth,
      __updateScrollbar,
      __initCalendar,
      __renderCalendar
    } = useCalendar(props, __renderScheduler, {
      scrollArea,
      pane
    })

    const {
      // computed
      days,
      intervals,
      intervalFormatter,
      ariaDateTimeFormatter,
      parsedCellWidth,
      // methods
      getResourceClasses,
      showResourceLabelDefault,
      styleDefault,
      getTimestampAtEventInterval,
      getTimestampAtEvent,
      getScopeForSlot,
      scrollToTime,
      timeDurationHeight,
      timeStartPos
    } = useInterval(props, {
      weekdaySkips,
      times,
      scrollArea,
      parsedStart,
      parsedEnd,
      maxDays: maxDaysRendered,
      size,
      headDaysColumnRef
    })

    const { move } = useMove(props, {
      parsedView,
      parsedValue,
      weekdaySkips,
      direction,
      maxDays: maxDaysRendered,
      times,
      emittedValue,
      emit
    })

    const {
      getDefaultMouseEventHandlers
    } = useMouse(emit, emitListeners)

    const {
      checkChange
    } = useCheckChange(emit, { days, lastStart, lastEnd })

    const {
      isKeyCode
    } = useEvents()

    useKeyboard(props, {
      rootRef,
      focusRef,
      focusValue,
      days,
      parsedView,
      parsedValue,
      emittedValue,
      weekdaySkips,
      direction,
      times
    })

    const resourcesWidth = computed(() => {
      if (rootRef.value) {
        return parseInt(getComputedStyle(rootRef.value).getPropertyValue('--calendar-resources-width'), 10)
      }
      return 0
    })

    const borderWidth = computed(() => {
      if (rootRef.value) {
        const calendarBorderWidth = getComputedStyle(rootRef.value).getPropertyValue('--calendar-border')
        const parts = calendarBorderWidth.split(' ')
        const part = parts.filter(part => part.indexOf('px') > -1)
        return parseInt(part[ 0 ], 0)
      }
      return 0
    })

    const computedWidth = computed(() => {
      const columnCount = props.columnCount !== undefined ? parseInt(props.columnCount, 10) : 1
      if (rootRef.value) {
        const width = size.width || rootRef.value.getBoundingClientRect().width
        if (width && resourcesWidth.value && borderWidth.value) {
          return ((width - scrollWidth.value - resourcesWidth.value - (borderWidth.value * days.value.length)) / days.value.length) / columnCount + 'px'
        }
      }
      return ((100 / days.value.length) / columnCount) + '%'
    })

    function __isCheckChange () {
      if (checkChange() === true
      && props.useNavigation === true
      && datesRef.value
      && focusRef.value) {
        if (document && document.activeElement !== datesRef.value[ focusRef.value ]) {
          let count = 0
          const interval = setInterval(() => {
            if (datesRef.value[ focusRef.value ]) {
              datesRef.value[ focusRef.value ].focus()
              if (++count === 10 || document.activeElement === datesRef.value[ focusRef.value ]) {
                clearInterval(interval)
              }
            }
            else {
              clearInterval(interval)
            }
          }, 250)
        }
      }
    }

    watch([days], __isCheckChange, { deep: true })

    watch(() => props.modelValue, (val, oldVal) => {
      if (emittedValue.value !== val) {
        if (props.animated === true) {
          const v1 = getDayIdentifier(parsed(val))
          const v2 = getDayIdentifier(parsed(oldVal))
          direction.value = v1 >= v2 ? 'next' : 'prev'
        }
        emittedValue.value = val
      }
      focusRef.value = val
    })

    watch(emittedValue, (val, oldVal) => {
      if (emittedValue.value !== props.modelValue) {
        if (props.animated === true) {
          const v1 = getDayIdentifier(parsed(val))
          const v2 = getDayIdentifier(parsed(oldVal))
          direction.value = v1 >= v2 ? 'next' : 'prev'
        }
        emit('update:modelValue', val)
      }
    })

    watch(focusRef, val => {
      if (val) {
        focusValue.value = parseTimestamp(val)
      }
    })

    watch(focusValue, (val) => {
      if (datesRef.value[ focusRef.value ]) {
        datesRef.value[ focusRef.value ].focus()
      }
    })

    watch(() => props.maxDays, val => {
      maxDaysRendered.value = val
    })

    onBeforeUpdate(() => {
      datesRef.value = {}
      resourcesRef.value = {}
    })

    onMounted(() => {
      __initCalendar()
    })

    // public functions

    function moveToToday () {
      emittedValue.value = today()
    }

    function next (amount = 1) {
      move(amount)
    }

    function prev (amount = 1) {
      move(-amount)
    }

    function __onResize ({ width, height }) {
      size.width = width
      size.height = height
    }

    function __isActiveDate (day) {
      return day.date === emittedValue.value
    }

    // function __isActiveResource (day) {
    //   return __isActiveDate(day)
    //     && day.hasTime
    //     && emittedValue.value.hasTime
    //     && day.time === emittedValue.value.time
    // }

    // Render functions

    function __renderHead () {
      return h('div', {
        ref: headerRef,
        roll: 'presentation',
        class: {
          'q-calendar-scheduler__head': true,
          'q-calendar__sticky': isSticky.value === true
        },
        style: {
          marginRight: scrollWidth.value + 'px'
        }
      }, [
        __renderHeadResources(),
        __renderHeadDaysColumn()
      ])
    }

    /**
     * Outputs the header that is above the resources
     * @slot head-resources
     * @mouse '-head-resources'
     * @scope { scope: { days: [], resource: [] } }
     * @event { scope: { days: [], resource: [] }, event }
     */
    function __renderHeadResources () {
      const slot = slots[ 'head-resources' ]

      const scope = {
        days: days.value,
        resource: props.resources
      }

      const style = {
        minWidth: resourcesWidth.value + 'px',
        // maxWidth: resourcesWidth.value + 'px',
        width: resourcesWidth.value + 'px'
      }

      return h('div', {
        class: {
          'q-calendar-scheduler__head--resources': true,
          'q-calendar__sticky': isSticky.value === true
        },
        style,
        ...getDefaultMouseEventHandlers('-head-resources', event => {
          return { scope, event }
        })
      }, [
        slot && slot({ scope })
      ])
    }

    function __renderHeadDaysBody () {
      return h('div', {
        class: 'q-calendar-scheduler__head--days__body'
      }, [
        ...__renderHeadDays(h)
      ])
    }

    function __renderHeadDaysColumn () {
      return h('div', {
        ref: headDaysColumnRef,
        class: {
          'q-calendar-scheduler__head--days__column': true
        }
      }, [
        __renderHeadDaysRow(),
        __renderHeadDaysEventsRow()
      ])
    }

    function __renderHeadDaysRow () {
      return h('div', {
        class: {
          'q-calendar-scheduler__head--days__weekdays': true
        }
      }, [
        ...__renderHeadDays()
      ])
    }

    function __renderHeadDaysEventsRow () {
      const slot = slots[ 'head-days-events' ]

      nextTick(() => {
        if (headDayEventsChildRef.value && props.columnCount === undefined && window) {
          try {
            const styles = window.getComputedStyle(headDayEventsChildRef.value)
            headDayEventsParentRef.value.parentElement.style.height = styles.height
            headDayEventsParentRef.value.style.height = styles.height
          }
          catch (e) {}
        }
      })

      return h('div', {
        class: {
          'q-calendar-scheduler__head--days__event': true
        }
      }, [
        slot && h('div', {
          ref: headDayEventsParentRef,
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            overflow: 'hidden',
            zIndex: 1
          }
        }, [
          slot({ scope: { days: days.value, ref: headDayEventsChildRef } })
        ]),
        ...__renderHeadDaysEvents()
      ])
    }

    function __renderHeadDays () {
      if (days.value.length === 1 && props.columnCount !== undefined && parseInt(props.columnCount, 10) > 0) {
        return Array.apply(null, new Array(parseInt(props.columnCount, 10)))
          .map((_, i) => i + parseInt(props.columnIndexStart, 10))
          .map(columnIndex => __renderHeadDay(days.value[ 0 ], columnIndex))
      }
      else {
        return days.value.map(day => __renderHeadDay(day))
      }
    }

    function __renderHeadDaysEvents () {
      if (days.value.length === 1 && props.columnCount !== undefined && parseInt(props.columnCount, 10) > 0) {
        return Array.apply(null, new Array(parseInt(props.columnCount, 10)))
          .map((_, i) => i + parseInt(props.columnIndexStart, 10))
          .map(columnIndex => __renderHeadDayEvent(days.value[ 0 ], columnIndex))
      }
      else {
        return days.value.map(day => __renderHeadDayEvent(day))
      }
    }

    function __renderHeadDay (day, columnIndex) {
      const headDaySlot = slots[ 'head-day' ]
      const headDateSlot = slots[ 'head-date' ]

      const styler = props.dayStyle || dayStyleDefault
      const activeDate = props.noActiveDate !== true && __isActiveDate(day)
      const dragValue = day.date

      const droppable = dragOverHeadDayRef.value === day.date
      const scope = { timestamp: day, columnIndex, resources: props.modelResources, droppable, activeDate }

      const width = isSticky.value === true ? props.cellWidth : computedWidth.value
      const style = {
        width,
        maxWidth: width,
        ...styler({ scope })
      }
      if (isSticky.value === true) {
        style.minWidth = width
      }
      const weekdayClass = typeof props.weekdayClass === 'function' ? props.weekdayClass({ scope }) : {}
      const isFocusable = props.focusable === true && props.focusType.includes('weekday')

      const data = {
        key: day.date + (columnIndex !== undefined ? '-' + columnIndex : ''),
        ref: (el) => { datesRef.value[ day.date ] = el },
        tabindex: isFocusable === true ? 0 : -1,
        class: {
          'q-calendar-scheduler__head--day': true,
          ...weekdayClass,
          ...getRelativeClasses(day),
          'q-active-date': activeDate,
          'q-calendar__hoverable': props.hoverable === true,
          'q-calendar__focusable': isFocusable === true
        },
        style,
        onDragenter: (e) => {
          if (props.dragEnterFunc !== undefined && typeof props.dragEnterFunc === 'function') {
            props.dragEnterFunc(e, 'head-day', scope)
              ? dragOverHeadDayRef.value = dragValue
              : dragOverHeadDayRef.value = ''
          }
        },
        onDragover: (e) => {
          if (props.dragOverFunc !== undefined && typeof props.dragOverFunc === 'function') {
            props.dragOverFunc(e, 'head-day', scope)
              ? dragOverHeadDayRef.value = dragValue
              : dragOverHeadDayRef.value = ''
          }
        },
        onDragleave: (e) => {
          if (props.dragLeaveFunc !== undefined && typeof props.dragLeaveFunc === 'function') {
            props.dragLeaveFunc(e, 'head-day', scope)
              ? dragOverHeadDayRef.value = dragValue
              : dragOverHeadDayRef.value = ''
          }
        },
        onDrop: (e) => {
          if (props.dropFunc !== undefined && typeof props.dropFunc === 'function') {
            props.dropFunc(e, 'head-day', scope)
              ? dragOverHeadDayRef.value = dragValue
              : dragOverHeadDayRef.value = ''
          }
        },
        onFocus: (e) => {
          if (isFocusable === true) {
            focusRef.value = day.date
          }
        },
        ...getDefaultMouseEventHandlers('-head-day', event => {
          return { scope, event }
        })
      }

      return h('div', data, [
        /// head-day slot replaces everything below it
        headDaySlot !== undefined && headDaySlot({ scope }),
        headDaySlot === undefined && __renderColumnHeaderBefore(day, columnIndex),
        headDaySlot === undefined && __renderDateHeader(day),
        headDaySlot === undefined && headDateSlot && headDateSlot({ scope }),
        headDaySlot === undefined && __renderColumnHeaderAfter(day, columnIndex),
        useFocusHelper()
      ])
    }

    function __renderDateHeader (day) {
      if (props.dateHeader === 'stacked') {
        return [
          props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
          props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
        ]
      }
      else if (props.dateHeader === 'inline') {
        if (props.weekdayAlign === 'left' && props.dateAlign === 'right') {
          return h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
          ])
        }
        else if (props.weekdayAlign === 'right' && props.dateAlign === 'left') {
          return h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
          ])
        }
        else {
          return h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
          ])
        }
      }
      else if (props.dateHeader === 'inverted') {
        if (props.weekdayAlign === 'left' && props.dateAlign === 'right') {
          return h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day),
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day)
          ])
        }
        else if (props.weekdayAlign === 'right' && props.dateAlign === 'left') {
          return h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day),
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day)
          ])
        }
        else {
          return h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day),
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day)
          ])
        }
      }
    }

    function __renderHeadDayEvent (day, columnIndex) {
      const headDayEventSlot = slots[ 'head-day-event' ]
      const activeDate = props.noActiveDate !== true && __isActiveDate(day)
      const scope = getScopeForSlot(day, columnIndex)
      scope.activeDate = activeDate
      const width = isSticky.value === true ? props.cellWidth : computedWidth.value
      const style = {
        width,
        maxWidth: width
      }
      if (isSticky.value === true) {
        style.minWidth = width
      }

      return h('div', {
        key: 'event-' + day.date + (columnIndex !== undefined ? '-' + columnIndex : ''),
        class: {
          'q-calendar-scheduler__head--day__event': true,
          ...getRelativeClasses(day),
          'q-active-date': activeDate
        },
        style
      }, [
        headDayEventSlot && headDayEventSlot({ scope })
      ])
    }

    function __renderHeadWeekday (day) {
      const slot = slots[ 'head-weekday-label' ]
      const divisor = props.dateHeader === 'inline' || props.dateHeader === 'inverted' ? 0.5 : 1
      const shortWeekdayLabel = props.shortWeekdayLabel === true
      const shortCellWidth = props.labelBreakpoints[ 1 ] > 0 && (parsedCellWidth.value * divisor) <= props.labelBreakpoints[ 1 ]
      const scope = { timestamp: day, shortWeekdayLabel }

      const data = {
        class: {
          'q-calendar-scheduler__head--weekday': true,
          [ 'q-calendar__' + props.weekdayAlign ]: true,
          'q-calendar__ellipsis': true
        }
      }

      return h('div', data, (slot && slot({ scope })) || __renderHeadWeekdayLabel(day, shortWeekdayLabel))
    }

    function __renderHeadWeekdayLabel (day, shortWeekdayLabel, shortCellWidth) {
      const weekdayLabel = weekdayFormatter.value(day, shortWeekdayLabel)
      return h('span', {
        class: 'q-calendar__ellipsis'
      }, shortCellWidth === true ? minCharWidth(weekdayLabel, props.minLabelLength) : weekdayLabel)
    }

    function __renderHeadDayDate (day) {
      const data = {
        class: {
          'q-calendar-scheduler__head--date': true,
          [ 'q-calendar__' + props.dateAlign ]: true
        }
      }

      return h('div', data, __renderHeadDayBtn(day))
    }

    function __renderHeadDayBtn (day) {
      const activeDate = props.noActiveDate !== true && __isActiveDate(day)
      const dayLabel = dayFormatter.value(day, false)
      const dayLabelSlot = slots[ 'head-day-button' ]
      const headDayValueSlot = slots[ 'head-day-button-value' ]
      const scope = { dayLabel, timestamp: day, activeDate }
      const ariaLabel = ariaDateFormatter.value(day)

      const data = {
        ariaLabel,
        class: {
          'q-calendar-scheduler__head--day__label': true,
          'q-calendar__button': true,
          'q-calendar__button--round': props.dateType === 'round',
          'q-calendar__button--bordered': day.current === true,
          'q-calendar__focusable': true
        },
        disabled: day.disabled,
        onKeydown: (e) => {
          if (day.disabled !== true
            && isKeyCode(e, [ 13, 32 ])) {
            e.stopPropagation()
            e.preventDefault()
          }
        },
        onKeyup: (e) => {
          // allow selection of date via Enter or Space keys
          if (day.disabled !== true
            && isKeyCode(e, [ 13, 32 ])) {
            emittedValue.value = day.date
            if (emitListeners.value.onClickDate !== undefined) {
              // eslint-disable-next-line vue/require-explicit-emits
              emit('click-date', { scope })
            }
          }
        },
        ...getDefaultMouseEventHandlers('-date', (event, eventName) => {
          if (eventName === 'click-date' || eventName === 'contextmenu-date') {
            emittedValue.value = day.date
          }
          return { scope, event }
        })
      }

      return headDayValueSlot
        ? headDayValueSlot({ scope })
        : useButton(props, data, dayLabelSlot ? dayLabelSlot({ scope }) : dayLabel)
    }

    function __renderColumnHeaderBefore (day, columnIndex) {
      const slot = slots[ 'column-header-before' ]
      if (slot) {
        const scope = { timestamp: day, columnIndex }
        return h('div', {
          class: 'q-calendar-scheduler__column-header--before'
        }, [
          slot({ scope })
        ])
      }
    }

    function __renderColumnHeaderAfter (day, columnIndex) {
      const slot = slots[ 'column-header-after' ]
      if (slot) {
        const scope = { timestamp: day, columnIndex }
        return h('div', {
          class: 'q-calendar-scheduler__column-header--after'
        }, [
          slot({ scope })
        ])
      }
    }

    function __renderBody () {
      return h('div', {
        class: 'q-calendar-scheduler__body'
      }, [
        __renderScrollArea()
      ])
    }

    function __renderScrollArea () {
      if (isSticky.value === true) {
        return h('div', {
          ref: scrollArea,
          class: {
            'q-calendar-scheduler__scroll-area': true,
            'q-calendar__scroll': true
          }
        }, [
          isSticky.value !== true && __renderDayResources(),
          __renderDayContainer()
        ])
      }
      else if (props.noScroll === true) {
        return __renderPane()
      }
      else {
        return h('div', {
          ref: scrollArea,
          class: {
            'q-calendar-scheduler__scroll-area': true,
            'q-calendar__scroll': true
          }
        }, [
          __renderPane()
        ])
      }
    }

    function __renderPane () {
      return h('div', {
        ref: pane,
        class: 'q-calendar-scheduler__pane'
      }, [
        __renderDayContainer()
      ])
    }

    function __renderDayContainer () {
      return h('div', {
        class: 'q-calendar-scheduler__day--container'
      }, [
        isSticky.value === true && props.noHeader !== true && __renderHead(),
        __renderResources()
      ])
    }

    function __renderResources (resources = undefined, indentLevel = 0, expanded = true) {
      if (resources === undefined) {
        resources = props.modelResources
      }
      return resources.map((resource, resourceIndex) => {
        return __renderResourceRow(resource, resourceIndex, indentLevel, expanded)
      })
    }

    function __renderResourceRow (resource, resourceIndex, indentLevel = 0, expanded = true) {
      const height = resource.height !== void 0 ? convertToUnit(resource.height) : 'auto'
      const style = { height: height }

      const resourceRow = h('div', {
        key: resource[ props.resourceKey ],
        class: {
          'q-calendar-scheduler__resource--row': true,
          'q-calendar__child': indentLevel > 0,
          'q-calendar__child--expanded': indentLevel > 0 && expanded === true,
          'q-calendar__child--collapsed': indentLevel > 0 && expanded !== true
        },
        style
      }, [
        __renderResource(resource, resourceIndex, indentLevel, expanded),
        __renderDayResources(resource, resourceIndex, indentLevel, expanded)
      ])

      if (resource.children !== undefined) {
        return [
          resourceRow,
          ...__renderResources(resource.children, indentLevel + 1, (expanded === false ? expanded : resource.expanded))
        ]
      }

      return [resourceRow]
    }

    function __renderResource (resource, resourceIndex, indentLevel = 0, expanded = true) {
      const slotResourceLabel = slots[ 'resource-label' ]
      const style = {
        minWidth: resourcesWidth.value + 'px',
        width: resourcesWidth.value + 'px'
      }
      style.height = parseInt(props.dayHeight, 10) > 0 ? convertToUnit(parseInt(props.dayHeight, 10)) : 'auto'
      if (parseInt(props.dayMinHeight, 10) > 0) {
        style.minHeight = convertToUnit(parseInt(props.dayMinHeight, 10))
      }
      const styler = props.resourceStyle || styleDefault
      const label = resource[ props.resourceLabel ]

      const isFocusable = props.focusable === true && props.focusType.includes('resource') && expanded === true
      const scope = { resource, days: days.value, resourceIndex, indentLevel, label }
      const dragValue = resource[ props.resourceKey ]
      scope.droppable = dragOverResource.value === dragValue
      const resourceClass = typeof props.resourceClass === 'function' ? props.resourceClass({ scope }) : {}

      return h('div', {
        key: resource[ props.resourceKey ],
        ref: (el) => { resourcesRef.value[ resource[ props.resourceKey ] ] = el },
        tabindex: isFocusable === true ? 0 : -1,
        class: {
          'q-calendar-scheduler__resource': indentLevel === 0,
          'q-calendar-scheduler__resource--section': indentLevel !== 0,
          ...resourceClass,
          'q-calendar__sticky': isSticky.value === true,
          'q-calendar__hoverable': props.hoverable === true,
          'q-calendar__focusable': isFocusable === true
        },
        style: {
          ...style,
          ...styler({ scope })
        },
        onDragenter: (e) => {
          if (props.dragEnterFunc !== undefined && typeof props.dragEnterFunc === 'function') {
            props.dragEnterFunc(e, 'resource', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onDragover: (e) => {
          if (props.dragOverFunc !== undefined && typeof props.dragOverFunc === 'function') {
            props.dragOverFunc(e, 'resource', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onDragleave: (e) => {
          if (props.dragLeaveFunc !== undefined && typeof props.dragLeaveFunc === 'function') {
            props.dragLeaveFunc(e, 'resource', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onDrop: (e) => {
          if (props.dropFunc !== undefined && typeof props.dropFunc === 'function') {
            props.dropFunc(e, 'resource', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onKeydown: (event) => {
          if (isKeyCode(event, [ 13, 32 ])) {
            event.stopPropagation()
            event.preventDefault()
          }
        },
        onKeyup: (event) => {
          // allow selection of resource via Enter or Space keys
          if (isKeyCode(event, [ 13, 32 ])) {
            if (emitListeners.value.onClickResource !== undefined) {
              // eslint-disable-next-line vue/require-explicit-emits
              emit('click-resource', { scope, event })
            }
          }
        },
        ...getDefaultMouseEventHandlers('-resource', event => {
          return { scope, event }
        })
      }, [
        slotResourceLabel
          ? slotResourceLabel({ scope })
          : [
              h('div', {
                class: {
                  'q-calendar__parent': resource.children !== undefined,
                  'q-calendar__parent--expanded': resource.children !== undefined && resource.expanded === true,
                  'q-calendar__parent--collapsed': resource.children !== undefined && resource.expanded !== true
                },
                onClick: (e) => {
                  e.stopPropagation()
                  resource.expanded = !resource.expanded
                  emit('update:modelResources', props.modelResources)
                  emit('resource-expanded', { expanded: resource.expanded, scope })
                  nextTick(() => {
                    __updateScrollbar() // verify scrollbar
                  })
                }
              }),
              h('div', {
                class: {
                  'q-calendar-scheduler__resource--text': true,
                  'q-calendar__overflow-wrap': true
                },
                style: {
                  paddingLeft: (10 * indentLevel + 2) + 'px'
                }
              }, [
                label
              ]),
              useFocusHelper()
            ]
      ])
    }

    function __renderDayResources (resource, resourceIndex, indentLevel = 0, expanded = true) {
      const style = {}
      style.height = parseInt(props.dayHeight, 10) > 0 ? convertToUnit(parseInt(props.dayHeight, 10)) : 'auto'
      if (parseInt(props.dayMinHeight, 10) > 0) {
        style.minHeight = convertToUnit(parseInt(props.dayMinHeight, 10))
      }

      const data = {
        class: 'q-calendar-scheduler__resource--days',
        style
      }

      return h('div', data,
        [
          ...__renderDays(resource, resourceIndex, indentLevel, expanded)
        ])
    }

    function __renderDays (resource, resourceIndex, indentLevel = 0, expanded = true) {
      if (days.value.length === 1 && props.columnCount > 0 && parseInt(props.columnCount, 10) > 0) {
        return Array.apply(null, new Array(parseInt(props.columnCount, 10)))
          .map((_, i) => i + parseInt(props.columnIndexStart, 10))
          .map(columnIndex => __renderDay(days.value[ 0 ], columnIndex, resource, resourceIndex, indentLevel, expanded))
      }
      else {
        return days.value.map(day => __renderDay(day, undefined, resource, resourceIndex, indentLevel, expanded))
      }
    }

    function __renderDay (day, columnIndex, resource, resourceIndex, indentLevel = 0, expanded = true) {
      const slot = slots.day

      const styler = props.dayStyle || dayStyleDefault
      const activeDate = props.noActiveDate !== true && parsedValue.value.date === day.date
      const dragValue = day.date + ':' + resource[ props.resourceKey ] + (columnIndex !== undefined ? ':' + columnIndex : '')
      const droppable = dragOverResource.value === dragValue
      const scope = { timestamp: day, columnIndex, resource, resourceIndex, indentLevel, activeDate, droppable }

      const width = isSticky.value === true ? props.cellWidth : computedWidth.value
      const style = {
        width,
        maxWidth: width,
        ...styler({ scope })
      }
      if (isSticky.value === true) {
        style.minWidth = width
      }
      style.height = parseInt(props.dayHeight, 10) > 0 ? convertToUnit(parseInt(props.dayHeight, 10)) : 'auto'
      if (parseInt(props.dayMinHeight, 10) > 0) {
        style.minHeight = convertToUnit(parseInt(props.dayMinHeight, 10))
      }
      const dayClass = typeof props.dayClass === 'function' ? props.dayClass({ scope }) : {}
      const isFocusable = props.focusable === true && props.focusType.includes('day') && expanded === true

      return h('div', {
        key: day.date + (columnIndex !== undefined ? ':' + columnIndex : ''),
        tabindex: isFocusable === true ? 0 : -1,
        class: {
          'q-calendar-scheduler__day': indentLevel === 0,
          'q-calendar-scheduler__day--section': indentLevel !== 0,
          ...dayClass,
          ...getRelativeClasses(day),
          'q-calendar__hoverable': props.hoverable === true,
          'q-calendar__focusable': isFocusable === true
        },
        style,
        onDragenter: (e) => {
          if (props.dragEnterFunc !== undefined && typeof props.dragEnterFunc === 'function') {
            props.dragEnterFunc(e, 'day', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onDragover: (e) => {
          if (props.dragOverFunc !== undefined && typeof props.dragOverFunc === 'function') {
            props.dragOverFunc(e, 'day', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onDragleave: (e) => {
          if (props.dragLeaveFunc !== undefined && typeof props.dragLeaveFunc === 'function') {
            props.dragLeaveFunc(e, 'day', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onDrop: (e) => {
          if (props.dropFunc !== undefined && typeof props.dropFunc === 'function') {
            props.dropFunc(e, 'day', scope)
              ? dragOverResource.value = dragValue
              : dragOverResource.value = ''
          }
        },
        onKeydown: (event) => {
          if (isKeyCode(event, [ 13, 32 ])) {
            event.stopPropagation()
            event.preventDefault()
          }
        },
        onKeyup: (event) => {
          // allow selection of date via Enter or Space keys
          if (isKeyCode(event, [ 13, 32 ])) {
            emittedValue.value = scope.timestamp.date
            if (emitListeners.value.onClickResource !== undefined) {
              // eslint-disable-next-line vue/require-explicit-emits
              emit('click-resource', { scope, event })
            }
          }
        },
        ...getDefaultMouseEventHandlers('-day-resource', event => {
          return { scope, event }
        })

      }, [
        slot && slot({ scope }),
        useFocusHelper()
      ])
    }

    // function __renderDayResources (day, columnIndex, resources = undefined, indentLevel = 0) {
    //   if (resources === undefined) {
    //     resources = props.modelResources
    //   }
    //   return props.modelResources.map((resource) => __renderDayResource(resource, day, columnIndex, indentLevel))
    // }

    // function __renderDayResource (resource, day, columnIndex, indentLevel) {
    //   const style = {}
    //   // const activeResource = __isActiveResource(resource)
    //   // const height = convertToUnit(props.resourceHeight)
    //   style.height = parseInt(props.dayHeight, 10) > 0 ? convertToUnit(parseInt(props.dayHeight, 10)) : 'auto'
    //   if (parseInt(props.dayMinHeight, 10) > 0) {
    //     style.minHeight = convertToUnit(parseInt(props.dayMinHeight, 10))
    //   }

    //   const styler = props.resourceStyle || styleDefault
    //   const slotDayResource = slots[ 'day-resource' ]
    //   const isFocusable = props.focusable === true && props.focusType.includes('day')

    //   const scope = { resource, timestamp: day, columnIndex, indentLevel }
    //   // TODO: Jeff - need key here
    //   scope.droppable = dragOverResource.value === resource[props.resourceKey]

    //   const resourceClass = typeof props.resourceClass === 'function' ? props.resourceClass({ scope }) : {}
    //   // const ariaLabel = ariaDateTimeFormatter.value(resource)

    //   const data = {
    //     key: getDate(day) + ':' + resource[props.resourceKey],
    //     // ariaLabel,
    //     tabindex: isFocusable === true ? 0 : -1,
    //     class: {
    //       'q-calendar-scheduler__day--resource': indentLevel === 0,
    //       'q-calendar-scheduler__day--resource__section': indentLevel !== 0,
    //       ...resourceClass,
    //       ...getResourceClasses(resource, props.selectedDates, props.selectedStartEndDates),
    //       'q-calendar__hoverable': props.hoverable === true,
    //       'q-calendar__focusable': isFocusable === true
    //     },
    //     style: {
    //       ...style,
    //       ...styler({ scope })
    //     },
    //     onDragenter: (e) => {
    //       if (props.dragEnterFunc !== undefined && typeof props.dragEnterFunc === 'function') {
    //         props.dragEnterFunc(e, 'resource', scope)
    //           ? dragOverResource.value = resource[props.resourceKey]
    //           : dragOverResource.value = ''
    //       }
    //     },
    //     onDragover: (e) => {
    //       if (props.dragOverFunc !== undefined && typeof props.dragOverFunc === 'function') {
    //         props.dragOverFunc(e, 'resource', scope)
    //           ? dragOverResource.value = resource[props.resourceKey]
    //           : dragOverResource.value = ''
    //       }
    //     },
    //     onDragleave: (e) => {
    //       if (props.dragLeaveFunc !== undefined && typeof props.dragLeaveFunc === 'function') {
    //         props.dragLeaveFunc(e, 'resource', scope)
    //           ? dragOverResource.value = resource[props.resourceKey]
    //           : dragOverResource.value = ''
    //       }
    //     },
    //     onDrop: (e) => {
    //       if (props.dropFunc !== undefined && typeof props.dropFunc === 'function') {
    //         props.dropFunc(e, 'resource', scope)
    //           ? dragOverResource.value = resource[props.resourceKey]
    //           : dragOverResource.value = ''
    //       }
    //     },
    //     onKeydown: (event) => {
    //       if (isKeyCode(event, [ 13, 32 ])) {
    //         event.stopPropagation()
    //         event.preventDefault()
    //       }
    //     },
    //     onKeyup: (event) => {
    //       // allow selection of date via Enter or Space keys
    //       if (isKeyCode(event, [ 13, 32 ])) {
    //         emittedValue.value = scope.timestamp.date
    //         if (emitListeners.value.onClickResource !== undefined) {
    //           // eslint-disable-next-line vue/require-explicit-emits
    //           emit('click-resource', { scope, event })
    //         }
    //       }
    //     },
    //     ...getDefaultMouseEventHandlers('-day-resource', event => {
    //       return { scope, event }
    //     })
    //   }

    //   const slottedDayResource = slotDayResource ? slotDayResource({ scope }) : undefined

    //   const resourceRow =  h('div', data, [ slottedDayResource, useFocusHelper() ])

    //   if (resource.children && resource.children.length > 0) {
    //     return [resourceRow, ...__renderResources()]
    //   }

    //   return resourceRow
    // }

    // function __renderBodyResources () {
    //   const data = {
    //     ariaHidden: 'true',
    //     class: {
    //       'q-calendar-scheduler__resources--column': true,
    //       'q-calendar__ellipsis': true,
    //       'q-calendar__sticky': isSticky.value === true
    //     },
    //     ...getDefaultMouseEventHandlers('-resource', event => {
    //       const timestamp = getTimestampAtEvent(event, parsedStart.value, props.timeClicksClamped, times.now)
    //       return { scope: { timestamp }, event }
    //     })
    //   }

    //   return h('div', data, __renderResourceLabels())
    // }

    // function __renderResourceLabels () {
    //   return props.modelResources.map((resource) => __renderResourceLabel(resource))
    // }

    function __renderResourcesError () {
      return h('div', {}, 'No resources have been defined')
    }

    function __renderScheduler () {
      if (canChangeDate.value) {
        const { start, end, maxDays } = renderValues.value
        startDate.value = start.date
        endDate.value = end.date
        maxDaysRendered.value = maxDays
      }

      const scheduler = withDirectives(h('div', {
        class: 'q-calendar-scheduler',
        key: startDate.value
      }, [
        isSticky.value !== true && props.noHeader !== true && __renderHead(),
        __renderBody()
      ]), [[
        ResizeObserver,
        __onResize
      ]])

      if (props.animated === true) {
        const transition = 'q-calendar--' + (direction.value === 'prev' ? props.transitionPrev : props.transitionNext)
        return h(Transition, {
          name: transition,
          appear: true
        }, () => scheduler)
      }

      return scheduler
    }

    // expose public methods
    expose({
      prev,
      next,
      move,
      moveToToday,
      updateCurrent
    })
    // Object.assign(vm.proxy, {
    //   prev,
    //   next,
    //   move,
    //   moveToToday,
    //   updateCurrent
    // })

    return () => __renderCalendar()
  }
})
