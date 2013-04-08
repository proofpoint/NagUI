/* `, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

NagUI.views.topview=Ext.extend(Ext.Panel, {
	layout: 'card',
	cls:'app',
	fullscreen: true,
	id:'mainapp',
	initComponent: function(){
		Ext.apply(this,{
			items: [
				{
					xtype:'panel',
					fullscreen: true,
					items: {xtype: 'toplist'},
					dockedItems: [
					{
						dock : 'top',
						xtype: 'toolbar',
						title: 'Nagios'
					 },
					{
						dock : 'top',
						xtype: 'toolbar',
						items: [
							{
								xtype: 'searchfield',
								name: 'q',
								placeholder: 'Search',
								listeners: {
									//blur: this.onSearch,
									keyup: function (field,e) {
										var key = e.browserEvent.keyCode;
										if( key == 13){
									        this.fireEvent('search', field.getValue());
											field.blur();
										}
									},
									scope: this
								}
							}
						]
					 }
					
					]
				},
				{xtype: 'groupview'},
				{xtype: 'hostview'},
				{xtype: 'serviceview'},
				{xtype: 'ackwindow'},
				{xtype: 'schedulewindow'}
				
			]
			// ,
			// dockedItems:{
			// 	dock: 'top',
			// 	xtype: 'mainheader'
			// }
		});
		NagUI.views.topview.superclass.initComponent.apply(this,arguments);
	},
    onSearch : function(comp, value) {
        this.fireEvent('search', value, this);
    }
});
//Ext.reg('nagiostopview',NagUI.views.topview);

NagUI.views.toplist=Ext.extend(Ext.List,{

	itemTpl: new Ext.XTemplate(
		'<div>',
		'{label}',
		'</div>',
		'<div>',
		'{status}',
		'</div>'		
		),
	autoHeight: true,
	initComponent: function(){
		Ext.applyIf(this,{
			store:new Ext.data.JsonStore({
				model: 'top_level',
				data: [
					{label: 'Host Problems',target: 2,query:'|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: state < 3|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3'},
					{label: 'Svc Problems',target: 3,query:'|Filter: scheduled_downtime_depth = 0|Filter: state_type = 1|Filter: state > 0|Filter: state < 3|Filter: host_acknowledged = 0|Filter: acknowledged = 0|Filter: notifications_enabled = 1|Filter: notification_period = 24x7|Filter: notification_period = 24x7_sans_holidays|Filter: notification_period = no_weekend|Or: 3'},
					{label: 'Host Groups',target: 1,query:'|Filter: num_hosts > 0'}
				]
			})
		});
		Ext.each(NagUI.customNodes,function(i){
			this.store.add({
				label: i.text,
				target: 1,
				query: NagUI.nodeQueries[i.parms.query]
			});
		},this);
		this.store.add();
		this.store.add();
		this.enableBubble('selectionchange');
		this.enableBubble('itemtap');
		NagUI.views.toplist.superclass.initComponent.apply(this,arguments);
	}
});

//Ext.reg('toplist',NagUI.views.toplist);