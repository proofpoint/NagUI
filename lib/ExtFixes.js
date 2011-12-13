// Override Ext.grid.Scroller object
// to workaround ExtJS bug EXTJSIV-3770
// more info at http://www.sencha.com/forum/showthread.php?142473-Bug-Tree-Grid-Scroller-Stops-Working
// Ext.override(Ext.grid.Scroller, {
// 
//   afterRender: function() {
//     var me = this;
//     me.callParent();
//     me.mon(me.scrollEl, 'scroll', me.onElScroll, me);
//     Ext.cache[me.el.id].skipGarbageCollection = true;
//     // add another scroll event listener to check, if main listeners is active
//     $(me.scrollEl.dom).scroll({scope: me}, me.onElScrollCheck);
//   },
// 
//   // flag to check, if main listeners is active
//   wasScrolled: false,
// 
//   // synchronize the scroller with the bound gridviews
//   onElScroll: function(event, target) {
//     this.wasScrolled = true; // change flag -> show that listener is alive
//     this.fireEvent('bodyscroll', event, target);
//   },
// 
//   // executes just after main scroll event listener and check flag state
//   onElScrollCheck: function(event, target) {
//     var me = event.data.scope;
//     if (!me.wasScrolled)
//       // Achtung! Event listener was disappeared, so we'll add it again
//       me.mon(me.scrollEl, 'scroll', me.onElScroll, me);
//     me.wasScrolled = false; // change flag to initial value
//   }
// 
// });
