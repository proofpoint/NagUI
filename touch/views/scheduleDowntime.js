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


nagios.views.schedulewindow=Ext.extend(Ext.Panel, {
	layout: 'fit',
	fullscreen: true,
	scheduleTarget: undefined,
	items: 	{
		title: 'Schedule Downtime',
		xtype:'form',
		scroll: 'vertical',
		items:[
			{
				xtype:'textfield',
				name: 'comment',
				label: 'Comment',
				required: true
			},
			{
				xtype:'fieldset',
				title: 'Start',
				items:[
					{
						fieldLabel: 'Date',
						xtype: 'datepickerfield',
						value: new Date(),
						name: 'startdate'
					},
					{
						fieldLabel: 'Time',
						xtype:'timepickerfield',
						value: new Date().format('H:i'),
						name: 'starttime'
					}
				]
			},
			{
				xtype:'fieldset',
				title: 'End',
				items:[
					{
						fieldLabel: 'Date',
						xtype: 'datepickerfield',
						value: new Date().add(Date.HOUR,2),
						name: 'enddate'
					},
					{
						fieldLabel: 'Time',
						xtype:'timepickerfield',
						value: new Date().add(Date.HOUR,2).format('H:i'),
						name: 'endtime'
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
							this.ownerCt.ownerCt.ownerCt.fireEvent('submitschedule');
						}
					},
					{
						xtype: 'button',
						text: 'Cancel',
						flex: 1,
						style: 'margin: .5em;',
						handler: function(){
							this.ownerCt.ownerCt.ownerCt.backBtn();
						}
					}
				]
			}
			
			
		]
	},
	initComponent: function(){
		nagios.views.serviceview.superclass.initComponent.apply(this,arguments);
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
		this.enableBubble('cancelschedule');
		this.enableBubble('submitschedule');
		
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
Ext.reg('schedulewindow',nagios.views.schedulewindow);

