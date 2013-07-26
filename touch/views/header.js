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

nagios.views.nodeheader=Ext.extend(Ext.form.FormPanel,{
	cls: 'x-toolbar-dark',
	baseCls: 'x-toolbar',
	initComponent: function(){
		this.addEvents(
			'search',
			'filter'
		);
		this.enableBubble('filter');
		this.enableBubble('search');
		
		Ext.apply(this,{
			defaults: {
				listeners: {
					change: this.onFieldChange,
					scope: this
				}
			},
			layout: {
				type: 'hbox',
				align: 'center'
			},
			items: [
				{
					xtype: 'selectfield',
					name: 'filter',
					prependText: 'Filter: ',
					options: [
						{text: 'none', value: ''},
						{text: 'Only Show Production', value: 'prodonly'},
						{text: 'Hide OK hosts/services', value: 'hideOK'}
					]
				},
				{
					xtype: 'spacer'
				},
				{
					xtype: 'selectfield',
					name: 'sort_by',
					prependText: 'Sort by:',
					options: [
						{text: 'Latest', value: 'last_check_time'},
						{text: 'Label', value: 'label'},
						{text: 'Event Time', value: 'last_hard_state_change'}
					]
				},
				{
					xtype: 'spacer'
				},
				{
					xtype: 'searchfield',
					name: 'q',
					placeholder: 'Search',
					listeners: {
						change: this.onFieldChange,
						keyup: function (field,e) {
							var key = e.browserEvent.keyCode;
							if( key == 13){
								field.blur();
							}
						},
						scope: this
					}
				}
			]
		});
		nagios.views.nodeheader.superclass.initComponent.apply(this,arguments);
	},
	onFieldChange: function(comp,value){
		if(comp.id=='search')
		{
			this.fireEvent('search',this.getValues(),this);
		}
		else
		{
			this.fireEvent('filter',this.getValues(),this);
		}
	}
});

Ext.reg('nodeheader',nagios.views.nodeheader);