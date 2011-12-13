/* Copyright 2010-2011 Proofpoint, Inc. All rights reserved.

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

NagUI.NagiosGridPanel=function(config){
	Ext.apply(this,config);
	PP.NagiosGridPanel.superclass.constructor.call(this,{
		store:this.store,
		cm: this.cm
	});
	if(this.system)
	{
		this.load();
	}
}
Ext.define('NagUI.NagiosGridPanel',{
	extend: 'Ext.grid.Panel',
	url: NagUI.url,
	system: '',
	title:'Nagios',
	// loadMask: true,
	columns:[
		{text:'Check',width:125,dataIndex:'description',sortable:true,id:'description'},
		{text:'Result',width:300,dataIndex:'plugin_output',sortable:true,id:'plugin_output'}	
	],
	initComponent: function(){
		if(!this.model)
		{
			this.model= 'nagios_node';
		}
		if(!this.proxy)
		{
			this.proxy= {
				type: 'ajax',
				url: NagUI.url
			};			
		}
		if(!this.sorters)
		{
			this.sorters=[
				{
					property: 'text',
					direction: 'ASC'
				}
			]			
			
		}
		if(!this.store)
		{
			this.store=new Ext.data.Store({
				model: this.model,
				proxy: this.proxy
			});		 
		}
		this.viewConfig={
			stripeRows: false,
			trackOver:false,
			selectedItemCls:'',
			overItemCls:'',
			getRowClass: function(record){
				var rowcls="pp-nagios-" + record.get("state");
				return rowcls;
			}
		},
		
		NagUI.NagiosGridPanel.superclass.initComponent.call(this);
		
	},
	load: function(system){
		this.store.removeAll();
		if(system) this.system=system;
		this.store.load({params:
			{
				query:'GET services|Columns: state description plugin_output acknowledged notification_period host_address notes_url scheduled_downtime_depth host_scheduled_downtime_depth downtimes_with_info notifications_enabled comments_with_info|Filter: host_name = ' + this.system + '|Filter: host_name = ' + this.system + '-deployment|Or:2'
			}
		});
		PP.log('NagiosGridPanel load: ' + this.system);
	}
});
