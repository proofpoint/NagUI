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

function displayDate(value){
	if(typeof value == 'number')
	{
		value=value*1000;
		if(value < 5000000)
		{
			return '';
		}
		var dt=new Date(value);		
	}
	else
	{
		var dt=value;
	}
	return dt.format('Y-m-d H:i:s (T)');
}
function displayState(value){
	if(value==0)
	{
		return 'OK';
	}
	if(value==1)
	{
		return 'Warning';
	}
	if(value==2)
	{
		return 'Critical';
	}
	if(value==3)
	{
		return 'Unknown';
	}
}

var nagiosTemplates={
	hostgroup:new Ext.XTemplate(
		'<div class=x-nagios-statuspanel>',
		'<Name: <b>{name}</b><br/>',
		'Hosts: {num_hosts}  UP: {num_hosts_up}<br/>',
		'Services OK: <span class=pp-nagios-0>{num_services_ok}</span>',
		' Warning: <span class=pp-nagios-1>{num_services_warn}</span>',
		' Critical: <span class=pp-nagios-2>{num_services_crit}</span>',
		' Unknown: <span class=pp-nagios-3>{num_services_unknown}</span>',
		'</div>',
		{
			asDate:displayDate,
			stateText:displayState
		}),
	service:new Ext.XTemplate(
		'<div class=x-nagios-statuspanel>',
		'Hostname: <b>{host_name}</b> : {host_address}, Service: <b>{description}</b> Nagios Server: {peer_name}<br />',
		'State: <span class=pp-nagios-{state}>{[this.stateText(values.state)]}</span> Output: <span style="background-color:white;padding-left:2px;padding-right:2px;">{plugin_output}</span> <br />',
		'Last check: {[this.asDate(values.last_check)]} Next check: {[this.asDate(values.next_check)]}    Last State Change: {[this.asDate(values.last_hard_state_change)]}<br />',
		'Notification Period: {notification_period} Host Notes: {host_notes} <br />',
		'Notes: <a target=_new href="{notes_url}">{notes_url}</a><br />',
		'Comments: ',
		'<tpl for="comments_with_info">',
			'{2} - <span style="font-size:7pt;font-style:italic;">{1}</span>;  ',
		'</tpl>',
		'</div>',
		{
			asDate:displayDate,
			stateText:displayState
		}),
	host:new Ext.XTemplate(
		'<div class=x-nagios-statuspanel>',
		'Hostname: <b>{name}</b> : {address} Nagios Server: {peer_name}<br />',
		'Services: ',
		'<tpl for="services_with_state">',
			' <span class=pp-nagios-{1}>{0}</span>  ',
		'</tpl><br />',
		'Hostgroups: {groups}<br />',
		'Last check: {[this.asDate(values.last_check)]} Next check: {[this.asDate(values.next_check)]}  Last State Change: {[this.asDate(values.last_hard_state_change)]}<br />',
		'Notes: {notes} <a target=_new href="{notes_url}">{notes_url}</a> <br />',
		'Comments: ',
		'<tpl for="comments_with_info">',
		'{2} - <span style="font-size:7pt;font-style:italic;">{1}</span>;  ',
		'</tpl>',
		'</div>',
		{
			asDate:displayDate,
			stateText:displayState,
			log:NagUI.log
		})
};
function commentWindow(n){
	if(!NagUI.nagios_write) return;
	
	NagUI.log(n);
	var title;
	if(!n.length && n.data.nagios_type!='host' && n.data.nagios_type!='service') return;
	if(n.length > 0)
	{
		title='Batch Comment';
	}
	else
	{
		title= n.data.nagios_type=='host' ? n.data.name : n.data.host_name + ' : ' + n.data.description;
	}
	var commentwin=new Ext.Window({
		layout:'border',
		width: 500,
		title: 'Add Comment',
		height:170,
		plain: true,
		ackNode:n,
		items: [
			{
				xtype:'panel',
				region: 'north',
				height: 30,
				baseCls:'x-nagios-statuspanel',
				bodyStyle:'padding:3px;font-weight:bold;',
				html: title
			},
			new Ext.FormPanel({
				frame:true,
				region:'center',
				id: 'comment_form',
				bodyStyle:'padding:5px 5px 0;font-size:11pt;',
				monitorValid:true,
				defaultType: 'checkbox',
				defaults:{
					anchor: '100%'
				},
				items:[
					{
						xtype:'textfield',
						fieldLabel: 'Comment',
						allowBlank: false,
						width:300,
						name:'comment'
					},
					{
						fieldLabel: 'Persist',
						name: 'persist',
						checked: true
					},
				],
				buttons:[
					{
						text: 'Commit',
						node:n,
						id:'buttontest',
						formBind:true,
						//disabled:true,
						handler: function(b,e)
						{
							sendNagiosCommand(commentNodeString(b.node,Ext.getCmp('comment_form').getForm().getValues()));
							commentwin.destroy();
						}
					}
				]
			})
		]
	});
	commentwin.show();
}

function submitcheckWindow(n){
	if(!NagUI.nagios_write) return;
	
	NagUI.log(n);
	var title;
	if(!n.length && n.data.nagios_type!='host' && n.data.nagios_type!='service') return;
	if(n.length > 0)
	{
		n=n[0];
	}
	else
	{
		title= n.data.nagios_type=='host' ? n.data.name : n.data.host_name + ' : ' + n.data.description;
	}
	var fields=[];
	if(n.data.nagios_type=='host')
	{
		fields=[
			{
				xtype:'textfield',
				name: 'host_name',
				fieldLabel: 'Host Name',
				allowBlank: false,
				value: n.data.host_name
			},
			{
				xtype: 'combo',
				fieldLabel: 'Check result',
				name: 'check_result',
				allowBlank: false,
				value:1,
				store:[[0,'UP'],[2,'DOWN'],[3,'UNREACHABLE']]
			},
			{
				xtype: 'textfield',
				name: 'plugin_output',
				allowBlank: false,
				fieldLabel: 'Check Output'
			},
			{
				xtype: 'textfield',
				name: 'perf_data',
				fieldLabel: 'Performance Data'
			}
		];		
	}
	else
	{
		fields=[
			{
				xtype:'textfield',
				name: 'host_name',
				fieldLabel: 'Host Name',
				allowBlank: false,
				value: n.data.host_name
			},
			{
				xtype: 'textfield',
				value: n.data.description,
				name: 'service_description',
				allowBlank: false,
				fieldLabel: 'Service'
			},
			{
				xtype: 'combo',
				fieldLabel: 'Check result',
				name: 'check_result',
				value:1,
				store:[[0,'OK'],[1,'WARNING'],[3,'UNKNOWN'],[2,'CRITICAL']]
			},
			{
				xtype: 'textfield',
				name: 'plugin_output',
				allowBlank: false,
				fieldLabel: 'Check Output'
			},
			{
				xtype: 'textfield',
				name: 'perf_data',
				fieldLabel: 'Performance Data'
			}
		];		
	}
	var submitcheckwin=new Ext.Window({
		layout:'border',
		width: 350,
		title: 'Submit Check Result',
		height:250,
		plain: true,
		ackNode:n,
		items: [
			{
				xtype:'panel',
				region: 'north',
				height: 30,
				baseCls:'x-nagios-statuspanel',
				bodyStyle:'padding:3px;font-weight:bold;',
				html: title
			},
			new Ext.FormPanel({
				frame:true,
				region:'center',
				id: 'checkresult_form',
				bodyStyle:'padding:5px 5px 0;font-size:11pt;',
				monitorValid:true,
				defaultType: 'checkbox',
				defaults:{
					anchor: '100%'
				},
				items: fields,
				buttons:[
					{
						text: 'Commit',
						node:n,
						id:'buttontest',
						formBind:true,
						//disabled:true,
						handler: function(b,e)
						{
							if(this.up('form').getForm().isValid())
							{
								sendNagiosCommand(submitcheckString(b.node,Ext.getCmp('checkresult_form').getForm().getValues()));
								submitcheckwin.destroy();
							}
						}
					}
				]
			})
		]
	});
	submitcheckwin.show();
}
function submitcheckString(node,opt){
	var dt=new Date();
	dt=dt.format('U');
	var str='COMMAND ['+ dt + '] ';	
	str+=(opt.service_description ? 'PROCESS_SERVICE_CHECK_RESULT' : 'PROCESS_HOST_CHECK_RESULT' );
	str+=';' + opt.host_name + ';';
	str+=( opt.service_description ? opt.service_description + ';' : '' );
	str+=opt.check_result +';';
	str+=opt.plugin_output +';';
	str+=opt.perf_data ? '|'+opt.perf_data : '';
	return str;
}


function scheduleDowntimeWindow(n){
	if(!NagUI.nagios_write) 
	{
		Ext.MessageBox.alert('Error','Command not allowed');
		return;
	}
	//NagUI.log(n);
	var title;
	if(n.length > 0)
	{
		title='Batch Downtime';
	}
	else
	{
		title=  n.data.nagios_type=='service' ? n.data.host_name + ' : ' + n.data.description : n.data.name;
	}
	var schedulewin=new Ext.Window({
		layout:'border',
		width: 400,
		title: 'Schedule Downtime',
		height:200,
		plain: true,
		ackNode:n,
		items: [
			{
				xtype:'panel',
				region: 'north',
				border: '0 0 0 0',
				height: 30,
				baseCls:'x-nagios-statuspanel',
				bodyStyle:'padding:3px;font-weight:bold;',
				html: title
			},
			{
				xtype:'form',
				frame: true,
				border: '0 0 0 0',
				region:'center',
				id: 'schedule_form',
				// bodyStyle:'font-size:11pt;',
				monitorValid:true,
				defaults:{
					anchor: '100%'
				},
				items:[
					{
						xtype: 'container',
			            anchor: '100%',
			            layout:'column',
						// frame:true,
						// 						border:0,
						items:[
							{
								columnWidth:.5,
								xtype:'container',
								layout:'anchor',
								items:[
									{
						                anchor:'90%',				                
										xtype: 'textfield',
										labelAlign:'top',
										fieldLabel: 'Start Time',
										name: 'start_date',
										value:new Date().format('Y/m/d H:i:s'),
										allowBlank:false,
										width:160										
									}
								]
							},
							{
								columnWidth:.5,
								xtype:'container',
								layout:'anchor',
								items:[
									{
										columnWidth:.5,
						                anchor:'90%',
										xtype: 'textfield',
										labelAlign:'top',
										fieldLabel: 'End Time',
										allowBlank:false,
										value:Ext.Date.add(new Date(),Ext.Date.HOUR,2).format('Y/m/d H:i:s'),
										name: 'end_date',
										width:160
									}
								]
							}
						]
					},
					{
						xtype:'textfield',
						fieldLabel: 'Comment',
						allowBlank:false,
						width:300,
						name:'comment'
					}		
					
				],
				// 
				// 	{	
				// 		layout:'column',
				// 		items:[
				// 			{
				// 				columnWidth:.025
				// 			},
				// 			{
				// 				columnWidth:.45,
				// 				// layout:'form',
				// 				items:[
				// 				{
				// 					xtype:'fieldset',
				// 					autoHeight:true,
				// 					frame: false,
				// 					border:0,
				// 					title: 'Start',
				// 					hideLabel: true,
				// 					labelWidth:40,
				// 					items:[
				// 				}
				// 				]
				// 			},
				// 			{
				// 				columnWidth:.05
				// 			},
				// 			{
				// 				columnWidth:.45,
				// 				// layout:'form',
				// 				items:[
				// 				{
				// 					xtype:'fieldset',
				// 					autoHeight:true,
				// 					title: 'End',
				// 					hideLabel: true,
				// 					frame: false,
				// 					border:0,
				// 					labelWidth:40,
				// 					items:[
				// 					]
				// 				}
				// 				]
				// 			},
				// 			{
				// 				columnWidth:.025
				// 			}							
				// 		]
				// 	},
				// ],
				buttons:[
					{
						text: 'Commit',
						node:n,
						id:'buttontest',
						formBind:true,
						//disabled:true,
						handler: function(b,e)
						{
							sendNagiosCommand(scheduleNodeString(b.node,Ext.getCmp('schedule_form').getForm().getValues()));
							schedulewin.close();
						}
					}
				]
			}
		]
	});
	//NagUI.log(schedulewin);
	schedulewin.show();
}


function ackWindow(n){
	if(!NagUI.nagios_write) return;
	NagUI.log(n);
	var title;
	if(n.length > 0)
	{
		var bc={};
		var x=0;
		Ext.each(n,function(item){
			var h=item.data.nagios_type=='host' ? item.data.name : item.data.host_name;
			if(typeof bc[h] == 'undefined')
			{
				x++;
				bc[h]=1;
			}
		});
		if(x==1)
		{
			title= (n[0].data.nagios_type=='host' ? n[0].data.name : n[0].data.host_name) + ': batch ack';
		}
		else
		{
			title='Batch Ack';			
		}
	}
	else
	{
		if(n.data.state==0 && n.data['host_name']!='undefined')
		{
			Ext.Msg.alert('N/A','This service is not ack-able');
			return;
		}
		title= n.data.nagios_type=='host' ? n.data.name : n.data.host_name + ' : ' + n.data.description;
	}
	var ackwin=new Ext.Window({
		layout:'border',
		width: 400,
		title: 'Ack Problem',
		height: ( typeof ackTicket == 'function' ? 320 : 200),
		plain: true,
		ackNode:n,
		items: [
			{
				xtype:'panel',
				region: 'north',
				height: 30,
				baseCls:'x-nagios-statuspanel',
				bodyStyle:'padding:3px;font-weight:bold;',
				html: title
			},
			new Ext.FormPanel({
				frame:true,
				region:'center',
				id: 'ack_form',
				bodyStyle:'padding:5px 5px 0;font-size:11pt;',
				monitorValid:true,
				defaultType: 'checkbox',
				defaults:{
					anchor: '100%'
				},
				items:[
					{
						xtype:'textfield',
						fieldLabel: 'Comment',
						//allowBlank:false,
						width:300,
						name:'ack_text'
					},
					{
						fieldLabel: 'Sticky',
						name:'sticky',
						checked:true
					},
					{
						fieldLabel: 'Notify',
						name: 'notify',
						checked: false
					},
					{
						fieldLabel: 'Persist',
						name: 'persist',
						checked: false
					},
					{
						xtype:'fieldset',
						title: 'Ticket',
						autoHeight:true,
						collapsed:false,
						collapsible: true,
						labelWidth: 200,
						items:[
							{
								fieldLabel: 'Create/Update Ticket',
								xtype: 'checkbox',
								name: 'ticket',
								checked: false
							},
							{
								fieldLabel: 'Ticket No.',
								name: 'ticket_num',
								xtype:'textfield',
								//disabled:true,
								emptyText: 'leave blank for new'
							}
						]
					}
				],
				buttons:[
					{
						text: 'Commit',
						ackNode:n,
						id:'buttontest',
						formBind:true,
						//disabled:true,
						handler: function(b,e)
						{
							var formData=Ext.getCmp('ack_form').getForm().getValues();
							if(typeof ackTicket=='function' && formData.ticket=='on')
							{
								NagUI.log('creating ticket');
								NagUI.log(formData);
								ackTicket(b.ackNode,formData,function(k,d,msg){
									formData.ack_text+=' ' + k;
									sendNagiosCommand(ackNodeString(b.ackNode,formData));
									if(typeof d !='undefined')
									{
										Ext.MessageBox.hide();
									}
									// Ext.MessageBox.show({
									// 	title: 'Ticket created',
									// 	msg: k + '<br /><a target="_blank" href="' + link + '">' + link + '</a>' 
									// });		
									Ext.MessageBox.show(msg);		
								});
							}
							else
							{
								sendNagiosCommand(ackNodeString(b.ackNode,formData));
							}
							ackwin.destroy();
						}
					}
				]
			})
		]
	});
	ackwin.show();
}
function scheduleRecheck(node)
{
	var nodelist;
	if( node.length > 0 )
	{
		nodelist=node;
	}
	else
	{
		nodelist=new Array(node);
	}
	var str='';
	var dt=new Date();
	dt=dt.format('U');
	Ext.each(nodelist,function(n){
		NagUI.log(n);
		if(str.length>0)
		{
			str+='|';
		}		
		str+='COMMAND ['+ dt + '] ';
		if(n.data.nagios_type=='host')
		{
			str+='SCHEDULE_FORCED_HOST_SVC_CHECKS;' + n.data.name + ';' + (dt * 1 + 10 );
		}
		if(n.data.nagios_type=='service')
		{
			str+='SCHEDULE_FORCED_SVC_CHECK;' + n.data.host_name + ';' + n.data.description + ';' + (dt * 1 + 20 );			
		}
	});
	sendNagiosCommand(str);
}

function removeDowntime(node)
{
	var nodelist;
	if( node.length > 0 )
	{
		nodelist=node;
	}
	else
	{
		nodelist=new Array(node);
	}
	var str='';
	var dt=new Date();
	dt=dt.format('U');
	Ext.each(nodelist,function(n){
		NagUI.log(n);
		if(n.data.downtimes_with_info.length>0)
		{
			Ext.each(n.data.downtimes_with_info,function(d){
				if(str.length>0)
				{
					str+='|';
				}		
				str+='COMMAND ['+ dt + '] ';
				if(n.data.nagios_type=='host')
				{
					str+='DEL_HOST_DOWNTIME;' + d[0];
				}
				if(n.data.nagios_type=='service')
				{
					str+='DEL_SVC_DOWNTIME;' + d[0];			
				}
			});
		}
	});
	sendNagiosCommand(str);
}

function removeComments(node)
{
	var nodelist;
	if( node.length > 0 )
	{
		nodelist=node;
	}
	else
	{
		nodelist=new Array(node);
	}
	var str='';
	var dt=new Date();
	dt=dt.format('U');
	Ext.each(nodelist,function(n){
		NagUI.log(n);
		if(str.length>0 && (n.data.nagios_type=='host' || n.data.nagios_type=='service'))
		{
			str+='|';
		}		
		str+='COMMAND ['+ dt + '] ';
		if(n.data.nagios_type=='host')
		{
			str+='DEL_ALL_HOST_COMMENTS;' + n.data.name;
		}
		if(n.data.nagios_type=='service')
		{
			str+='DEL_ALL_SVC_COMMENTS;' + n.data.host_name + ';' + n.data.description;			
		}
	});
	sendNagiosCommand(str);
}

function toggleAlerts(node,enabledisable)
{
	if(typeof enabledisable != 'string')
	{
		enabledisable='ENABLE';
	}
	var nodelist;
	if( node.length > 0 )
	{
		nodelist=node;
	}
	else
	{
		nodelist=new Array(node);
	}
	var str='';
	var dt=new Date();
	dt=dt.format('U');
	Ext.each(nodelist,function(n){
		NagUI.log(n);
		if(str.length>0)
		{
			str+='|';
		}		
		str+='COMMAND ['+ dt + '] ';
		if(n.data.nagios_type=='hostgroup')
		{
			str+=enabledisable +'_HOSTGROUP_HOST_NOTIFICATIONS;' + n.data.name;
			str+='|COMMAND ['+ dt + '] ';
			str+=enabledisable +'_HOSTGROUP_SVC_NOTIFICATIONS;' + n.data.name;
		}
		if(n.data.nagios_type=='host')
		{
			str+=enabledisable +'_HOST_NOTIFICATIONS;' + n.data.name;
			str+='|COMMAND ['+ dt + '] ';
			str+=enabledisable +'_HOST_SVC_NOTIFICATIONS;' + n.data.name;
		}
		if(n.data.nagios_type=='service')
		{
			str+=enabledisable +'_SVC_NOTIFICATIONS;' + n.data.host_name + ';' + n.data.description;			
		}
	});
	sendNagiosCommand(str);
}

function sendNagiosCommand(str,method,server)
{
	var params={
		query: str
	};
	if(server)
	{
		params.peer_name=server;
	}
	Ext.Ajax.request({
		url: NagUI.url,
		method: method,
		params: params,
		failure:function(r,o){
			Ext.Msg.alert('Error','There was an error processing the command: <br>' + Ext.decode(r.responseText).message);
		}
	});
	Ext.notify.msg(' Request Sent','');
}

function scheduleNodeString(node,opt){
	var nodelist;
	if(node.length>0)
	{
		nodelist=node;
	}
	else
	{
		nodelist=new Array(node);
	}
	var str='';
	var start=new Date(opt.start_date.replace(/-/g,'/')+ ' GMT' + new Date().format('O')).format('U');
	var end=new Date(opt.end_date.replace(/-/g,'/')+ ' GMT' +new Date().format('O')).format('U');
	var dt=new Date();
	dt=dt.format('U');
	Ext.each(nodelist,function(n){
		NagUI.log(n);
		if(str.length>0)
		{
			str+='|';
		}		
		str+='COMMAND ['+ dt + '] ';
		if(n.data.nagios_type=='hostgroup')
		{
			str+='SCHEDULE_HOSTGROUP_HOST_DOWNTIME;' + n.data.name + ';' + start + ';' + end +';1;0;0;USERNAME;' + opt.comment;
			str+='|COMMAND ['+ dt + '] ';
			str+='SCHEDULE_HOSTGROUP_SVC_DOWNTIME;' + n.data.name + ';' + start + ';' + end + ';1;0;0;USERNAME;' + opt.comment;
		}
		if(n.data.nagios_type=='host')
		{
			str+='SCHEDULE_HOST_DOWNTIME;' + n.data.name + ';' + start + ';' + end + ';1;0;0;USERNAME;' + opt.comment;
			str+='|COMMAND ['+ dt + '] ';
			str+='SCHEDULE_HOST_SVC_DOWNTIME;' + n.data.name + ';' + start + ';' + end + ';1;0;0;USERNAME;' + opt.comment;
		}
		if(n.data.nagios_type=='service')
		{
			str+='SCHEDULE_SVC_DOWNTIME;' + n.data.host_name + ';' + n.data.description + ';' + start + ';' + end + ';1;0;0;USERNAME;' + opt.comment;			
		}
	});
	return str;
}
function ackNodeString(node,opt){
	var nodelist;
	if(node.length>0)
	{
		nodelist=node;
	}
	else
	{
		nodelist=new Array(node);
	}
	var str='';
	Ext.each(nodelist,function(n){
		NagUI.log(n);
		var ack='';
		var ack_text='acknowledged';
		if(opt.ack_text){
			ack_text=opt.ack_text;
		}
		var dt=new Date();
		dt=dt.format('U');
		ack+='COMMAND ['+ dt + '] ';
		ack+= n.data.nagios_type=='host' ? 'ACKNOWLEDGE_HOST_PROBLEM;' : 'ACKNOWLEDGE_SVC_PROBLEM;';
		ack+=n.data.nagios_type=='host' ? n.data.name + ';' : n.data.host_name + ';';
		ack+=n.data.nagios_type=='service' ? n.data.description + ';' : '';
		ack+=opt.sticky ? '2;' : '0;';
		ack+=opt.notify ? '1;' : '0;';
		ack+=opt.persist ? '1;' : '0;';
		ack+='USERNAME;';
		ack+=ack_text;
		if(str.length>0)
		{
			str+='|';
		}
		str+=ack;
	}); 
	return str;
}

function commentNodeString(node,opt){
	var nodelist;
	if(node.length>0)
	{
		nodelist=node;
	}
	else
	{
		nodelist=new Array(node);
	}
	var str='';
	Ext.each(nodelist,function(n){
		NagUI.log('doing comment for ');
		NagUI.log(n);
		var comment='';
		if(opt.comment){
			comment=opt.comment;
		}
		if(comment.length==0) return;
		if(n.data.nagios_type!='host' && n.data.nagios_type!='service') return;
		if(str.length>0)
		{
			str+='|';
		}
		var dt=new Date();
		dt=dt.format('U');
		str+='COMMAND ['+ dt + '] ';
		if(n.data.nagios_type=='host')
		{
			str+='ADD_HOST_COMMENT;';
		}		
		if(n.data.nagios_type=='host')
		{
			str+='ADD_HOST_COMMENT;';
			str+=n.data.name + ';';
		}		
		if(n.data.nagios_type=='service')
		{
			str+='ADD_SVC_COMMENT;';
			str+=n.data.host_name + ';';
			str+=n.data.description + ';';
		}		
		str+=opt.persist ? '1;' : '0;';
		str+='USERNAME;';
		str+=comment;
	}); 
	return str;
}
// 
// function refreshNode(n)
// {
// 	if(typeof n.refresh == 'function')
// 	{
// 	    n.refresh();
// 	}
// 	if(n.isExpanded() && n.isExpandable())
// 	{
// 		if(typeof n.reload == 'function')		
// 		{		
// 			n.reload();
// 		}
// 	}
// 	if(n.isExpandable() && !n.isExpanded())
// 	{
// 		n.loaded=false;
// 	}
// }
// 
