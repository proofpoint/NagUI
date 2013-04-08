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


NagUI.views.ackwindow=Ext.extend(Ext.Panel, {
	layout: 'fit',
	fullscreen: true,
	ackTarget: undefined,
	items: 	{
		title: 'Ack Problem',
		xtype:'form',
		scroll: 'vertical',
		items:[
			{
				xtype:'textfield',
				name: 'ack_text',
				label: 'Comment',
				required: true
			},
			{
				xtype: 'checkboxfield',
				name: 'sticky',
				label: 'Sticky',
				value: 'on',
				checked: true
			},
			{
				xtype: 'checkboxfield',
				name: 'notify',
				label: 'Notify',
				value: 'on',
				checked: false
			},
			{
				xtype: 'checkboxfield',
				name: 'persist',
				label: 'Persist',
				value: 'on',
				checked: false
			},
			{
				xtype:'fieldset',
				title: 'Ticket',
				items:[
					{
						fieldLabel: 'Create/Update Ticket',
						xtype: 'checkboxfield',
						name: 'ticket',
						value: 'on',
						checked: false
					},
					{
						fieldLabel: 'Ticket No.',
						name: 'ticket_num',
						xtype:'textfield',
						emptyText: 'leave blank for new'
					}
				]
			},
			{
				layout:'vbox',
				items:[
					{
						xtype: 'button',
						text: 'Submit',
						flex: 1,
						style: 'margin: .5em;',
						handler: function(){
							this.ownerCt.ownerCt.ownerCt.fireEvent('submitack');
						}
					},
					{
						xtype: 'button',
						text: 'Cancel',
						flex: 1,
						style: 'margin: .5em;',
						handler: function(){
							Ext.ControllerManager.get('overview').main.setActiveItem(3,{type: 'slide', direction: 'right'});
						}
					}
				]
			}
			
			
		]
	},
	initComponent: function(){
		NagUI.views.serviceview.superclass.initComponent.apply(this,arguments);
		this.addDocked({
			dock: 'top',
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
					handler: function(){}
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
		this.enableBubble('cancelack');
		this.enableBubble('submitack');
		
	},
	backBtn: function(){
		if(this.returnPanel)
		{
			this.ownerCt.layout.setActiveItem(this.returnPanel,{type: 'slide', direction: 'right'});			
		}
		else
		{
			this.ownerCt.layout.prev({type: 'slide', direction: 'right'});			
		}
	}
});
//Ext.reg('ackwindow',NagUI.views.ackwindow);

