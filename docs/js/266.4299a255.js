(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[266],{"6f40":function(e,n,t){"use strict";t.r(n),n["default"]="<template>\n  <div style=\"max-width: 800px; width: 100%;\">\n    <q-calendar\n      v-model=\"selectedDate\"\n      view=\"week-scheduler\"\n      :resources=\"resources\"\n      :resource-height=\"50\"\n      locale=\"en-us\"\n      style=\"height: 400px;\"\n    >\n      <template #head-day=\"{ timestamp }\">\n        {{ getHeadDay(timestamp) }}\n      </template>\n    </q-calendar>\n  </div>\n</template>\n\n<script>\nexport default {\n  data () {\n    return {\n      selectedDate: '',\n      resources: [\n        { label: 'John' },\n        { label: 'Mary' },\n        { label: 'Susan' },\n        { label: 'Olivia' },\n        { label: 'Board Room' },\n        { label: 'Room-1' },\n        { label: 'Room-2' }\n      ]\n    }\n  },\n\n  methods: {\n    getHeadDay (timestamp) {\n      return `The date is: ${timestamp.date}`\n    }\n  }\n}\n<\/script>\n"}}]);