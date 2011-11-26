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

nagios.views.hostlist=Ext.extend(Ext.List,{
	cls: 'x-list-marginitems',
	autoHeight: true,
	plugins:[{
		ptype: 'pullrefresh',
		refreshFn:function(rtnFn,pl){
			var s=pl.list.store;
			s.load({params:s.queryParams, callback: rtnFn, scope: pl});			
		}
	}],
	itemTpl: new Ext.XTemplate(
		'<div class="nagiosgradient-{state} x-list-margin-item">',
		'{label}',
		'<img src="/extjs/resources/images/default/s.gif" class="ack-{acknowledged}" unselectable="on">',
		'<img src="/extjs/resources/images/default/s.gif" class="comment-{[values.comments_with_info.length]}" unselectable="on">',
		'<img src="/extjs/resources/images/default/s.gif" class="ndisabled-{notifications_enabled}" unselectable="on">',
		'<img src="/extjs/resources/images/default/s.gif" class="{notification_period}" unselectable="on">',
		'<img src="/extjs/resources/images/default/s.gif" class="schedule-{scheduled_downtime_depth}" unselectable="on">',
		
		'<div class="hostgroup-status ">',
		'Services Crit: <span class=nagios-2>{num_services_crit}</span> ',
		'Warn: <span class=nagios-1>{num_services_warn}</span> ',
		'OK: <span class=nagios-0>{num_services_ok}</span> ',
		'Unknown <span class=nagios-3>{num_services_unknown}</span> ',
		'</div>',
		'</div>'
	),
	store:new Ext.data.Store({
		model: 'Host',
		queryParams:{},
		listeners:{
			beforeload : {
				fn: function(s,options){
					s.queryParams={};
					Ext.apply(s.queryParams,options.params);
					if(!options.params.query.match('GET'))
					{
						options.params.query='GET hosts|Columns: notification_period address groups notes_url scheduled_downtime_depth next_check downtimes_with_info notifications_enabled comments_with_info acknowledged last_check last_hard_state_change name num_services_ok num_services_warn num_services_crit num_services_unknown state' + options.params.query;
					}
				}
			}
		}
	}),
	initComponent: function(){
		nagios.views.hostlist.superclass.initComponent.apply(this,arguments);
		this.enableBubble('selectionchange');
		this.enableBubble('itemtap');
		this.enableBubble('itemdoubletap');
		
	}
});

Ext.reg('hostlist',nagios.views.hostlist);


nagios.views.hostview=Ext.extend(Ext.Panel, {
	layout: 'fit',
	fullscreen: true,
	items: 	{xtype: 'hostlist'},
	initComponent: function(){
		nagios.views.hostview.superclass.initComponent.apply(this,arguments);
		this.addDocked({
			dock: 'top',
			id: 'test',
			xtype: 'toolbar',
			items: [
				{
					text: 'Back',
					xtype: 'button',
					ui: 'back',
					handler: this.backBtn,
					scope: this
				},
				{
					xtype:'spacer'
				},
				{
					text: '',
					scope:this,
					iconCls:'refresh',
					iconMask:true,
					handler: function()
					{
						this.items.items[0].loadMask.enable();
						var s=this.items.items[0].store;
						s.load({params:s.queryParams});
					}
				},
				{
					xtype:'spacer'
				}
			],
			cls: 'x-toolbar-dark',
			baseCls: 'x-toolbar',
			layout: {
				type: 'hbox',
				align: 'center'
			}			
		});
	},
	backBtn: function(){
		if(
			// if on host list as result of search
			Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].getText() == 'Results'
			||
			// if on host list as result of 'host problems
			Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].getText() == 'Host Problems'
			
			)
		{
			this.ownerCt.layout.setActiveItem(0,{type: 'slide', direction: 'right'});			
		}
		else
		{
			this.ownerCt.layout.prev({type: 'slide', direction: 'right'});			
		}
	}
});
Ext.reg('hostview',nagios.views.hostview);
