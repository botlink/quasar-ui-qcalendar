(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[38],{d72a:function(a,t,e){"use strict";e.r(t);var i=function(){var a=this,t=a.$createElement,e=a._self._c||t;return e("div",{staticStyle:{"max-width":"800px",width:"100%"}},[e("q-calendar",{directives:[{name:"touch-swipe",rawName:"v-touch-swipe.mouse.left.right",value:a.handleSwipe,expression:"handleSwipe",modifiers:{mouse:!0,left:!0,right:!0}}],ref:"calendar",staticStyle:{height:"400px",overflow:"hidden"},attrs:{view:"week-agenda",animated:"","transition-prev":"slide-right","transition-next":"slide-left",locale:"en-us"},scopedSlots:a._u([{key:"day-body",fn:function(t){var i=t.timestamp;return[a._l(a.getAgenda(i),(function(t){return[e("div",{key:i.date+t.time,staticClass:"justify-start q-ma-sm shadow-5 bg-grey-6",attrs:{label:t.time}},[t.avatar?e("div",{staticClass:"row justify-center",staticStyle:{"margin-top":"30px",width:"100%"}},[e("q-avatar",{staticStyle:{"margin-top":"-25px","margin-bottom":"10px","font-size":"60px","max-height":"50px"}},[e("img",{staticStyle:{border:"#9e9e9e solid 5px"},attrs:{src:t.avatar}})])],1):a._e(),e("div",{staticClass:"col-12 q-px-sm"},[e("strong",[a._v(a._s(t.time))])]),t.desc?e("div",{staticClass:"col-12 q-px-sm",staticStyle:{"font-size":"10px"}},[a._v("\n            "+a._s(t.desc)+"\n          ")]):a._e()])]}))]}}]),model:{value:a.selectedDate,callback:function(t){a.selectedDate=t},expression:"selectedDate"}})],1)},r=[],s=e("4082"),n=e.n(s),d={data:function(){return{selectedDate:"",agenda:{1:[{time:"08:00",avatar:"https://cdn.quasar.dev/img/boy-avatar.png",desc:"Meeting with CEO"},{time:"08:30",avatar:"https://cdn.quasar.dev/img/avatar.png",desc:"Meeting with HR"},{time:"10:00",avatar:"https://cdn.quasar.dev/img/avatar1.jpg",desc:"Meeting with Karen"}],2:[{time:"11:30",avatar:"https://cdn.quasar.dev/img/avatar2.jpg",desc:"Meeting with Alisha"},{time:"17:00",avatar:"https://cdn.quasar.dev/img/avatar3.jpg",desc:"Meeting with Sarah"}],3:[{time:"08:00",desc:"Stand-up SCRUM",avatar:"https://cdn.quasar.dev/img/material.png"},{time:"09:00",avatar:"https://cdn.quasar.dev/img/boy-avatar.png"},{time:"10:00",desc:"Sprint planning",avatar:"https://cdn.quasar.dev/img/material.png"},{time:"13:00",avatar:"https://cdn.quasar.dev/img/avatar1.jpg"}],4:[{time:"09:00",avatar:"https://cdn.quasar.dev/img/avatar3.jpg"},{time:"10:00",avatar:"https://cdn.quasar.dev/img/avatar2.jpg"},{time:"13:00",avatar:"https://cdn.quasar.dev/img/material.png"}],5:[{time:"08:00",avatar:"https://cdn.quasar.dev/img/boy-avatar.png"},{time:"09:00",avatar:"https://cdn.quasar.dev/img/avatar2.jpg"},{time:"09:30",avatar:"https://cdn.quasar.dev/img/avatar4.jpg"},{time:"10:00",avatar:"https://cdn.quasar.dev/img/avatar5.jpg"},{time:"11:30",avatar:"https://cdn.quasar.dev/img/material.png"},{time:"13:00",avatar:"https://cdn.quasar.dev/img/avatar6.jpg"},{time:"13:30",avatar:"https://cdn.quasar.dev/img/avatar3.jpg"},{time:"14:00",avatar:"https://cdn.quasar.dev/img/linux-avatar.png"},{time:"14:30",avatar:"https://cdn.quasar.dev/img/avatar.png"},{time:"15:00",avatar:"https://cdn.quasar.dev/img/boy-avatar.png"},{time:"15:30",avatar:"https://cdn.quasar.dev/img/avatar2.jpg"},{time:"16:00",avatar:"https://cdn.quasar.dev/img/avatar6.jpg"}]}}},methods:{getAgenda:function(a){return this.agenda[parseInt(a.weekday,10)]},calendarNext:function(){this.$refs.calendar.next()},calendarPrev:function(){this.$refs.calendar.prev()},handleSwipe:function(a){var t=a.evt,e=n()(a,["evt"]);e.duration>=30&&("right"===e.direction?this.calendarPrev():"left"===e.direction&&this.calendarNext()),!1!==t.cancelable&&t.preventDefault(),t.stopPropagation()}}},v=d,c=e("2877"),p=e("cb32"),m=e("12c5"),g=e("eebe"),l=e.n(g),u=Object(c["a"])(v,i,r,!1,null,null,null);t["default"]=u.exports;l()(u,"components",{QAvatar:p["a"]}),l()(u,"directives",{TouchSwipe:m["a"]})}}]);