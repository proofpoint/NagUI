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

nagios.views.grouplist=Ext.extend(Ext.List,{
	autoHeight: true,
	plugins:[{
		ptype: 'pullrefresh',
		refreshFn:function(rtnFn,pl){
			var s=pl.list.store;
			s.load({params:s.queryParams, callback: rtnFn, scope: pl});			
		}
	}],
	itemTpl: new Ext.XTemplate(
		'<div>',
		'{label}',
		'<div class=hostgroup-status>',
		'Hosts: {num_hosts} ',
		'Services Crit: <span class=nagios-2>{num_services_crit}</span> ',
		'Warn: <span class=nagios-1>{num_services_warn}</span> ',
		'Unknown <span class=nagios-3>{num_services_unknown}</span> ',
		'</div>',
		'</div>'
	),
	store:new Ext.data.Store({
		model: 'Group',
		queryParams:{},
		listeners:{
			beforeload : {
				fn: function(s,options){
					s.queryParams={};
					Ext.apply(s.queryParams,options.params);
					if(!options.params.query.match('GET'))
					{
						options.params.query='GET hostgroups|Columns: name num_hosts num_services_ok num_services_warn num_services_crit num_services_unknown' + options.params.query;						
					}
				}
			}
		}
	}),
	initComponent: function(){
		nagios.views.grouplist.superclass.initComponent.apply(this,arguments);
		this.enableBubble('selectionchange');
		this.enableBubble('itemtap');
	}
});

Ext.reg('grouplist',nagios.views.grouplist);


nagios.views.groupview=Ext.extend(Ext.Panel, {
	layout: 'fit',
	fullscreen: true,
	items: 	{xtype: 'grouplist'},
	initComponent: function(){
		nagios.views.groupview.superclass.initComponent.apply(this,arguments);
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
		this.ownerCt.layout.prev({type: 'slide', direction: 'right'});
	}
});
Ext.reg('groupview',nagios.views.groupview);
