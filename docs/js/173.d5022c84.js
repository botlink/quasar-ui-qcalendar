(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[173],{"03668":function(e,n,t){"use strict";t.r(n),n["default"]='<template>\n  <div style="max-width: 800px; width: 100%;">\n    <q-calendar\n      v-model="selectedDate"\n      :column-header-after="true"\n      :column-count="3"\n      view="day"\n      locale="en-us"\n      style="height: 400px;"\n    >\n      <template #column-header-after="{ index }">\n        <div class="q-ma-xs">\n          <q-item v-if="index === 0" clickable v-ripple>\n            <q-item-section side>\n              <q-avatar size="42px">\n                <img src="https://cdn.quasar.dev/img/avatar1.jpg" />\n              </q-avatar>\n            </q-item-section>\n            <q-item-section>\n              <q-item-label>Mary</q-item-label>\n              <q-item-label caption>Content Writer</q-item-label>\n            </q-item-section>\n          </q-item>\n          <q-item v-if="index === 1" clickable v-ripple>\n            <q-item-section side>\n              <q-avatar size="42px">\n                <img src="https://cdn.quasar.dev/img/avatar2.jpg" />\n              </q-avatar>\n            </q-item-section>\n            <q-item-section>\n              <q-item-label>Jessica</q-item-label>\n              <q-item-label caption>Designer</q-item-label>\n            </q-item-section>\n          </q-item>\n          <q-item v-if="index === 2" clickable v-ripple>\n            <q-item-section side>\n              <q-avatar size="42px">\n                <img src="https://cdn.quasar.dev/img/avatar4.jpg" />\n              </q-avatar>\n            </q-item-section>\n            <q-item-section>\n              <q-item-label>Scott</q-item-label>\n              <q-item-label caption>Software Developer</q-item-label>\n            </q-item-section>\n          </q-item>\n        </div>\n      </template>\n    </q-calendar>\n  </div>\n</template>\n\n<script>\nexport default {\n  data () {\n    return {\n      selectedDate: \'\'\n    }\n  }\n}\n<\/script>\n'}}]);