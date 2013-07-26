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

Ext.regController('overview',{
	id: 'overview',
	list: function() {
		this.main=this.render({
			//id: 'main',
			xtype:'nagiostopview',
			listeners: {
				scope: this,
				filter: this.onFilter,
				//selectionchange: this.onSelected,
				search: this.doSearch,
				itemtap: this.onTap,
				itemdoubletap: this.showInfo,
				ack: this.ackWindow,
				submitack: this.sendAck,
				toggleAlerts: this.toggleAlerts,
				submitschedule: this.sendScheduledDowntime,
				scheduleDowntime: this.scheduleDowntime
			},
			fullscreen:true
		
		},Ext.getBody());
		this.getUser();
		Ext.repaint();
	},
	toggleAlerts: function(n){
		sendNagiosCommand(toggleAlertString(n));
	},
	scheduleDowntime: function (n){
		if(!NagUI.nagios_write) {
			alert('write commands not allowed');
			return;
		}
		var title;
		if(n.length > 0)
		{
			title='Batch Ack';
		}
		else
		{
			title= 'Downtime: ' +n.data.nagios_type=='host' ? n.name : n.data.host_name + ' : ' + n.data.description;
		}
		this.main.items.items[5].scheduleTarget=n;
		this.main.items.items[5].returnPanel = Ext.getCmp('mainapp').items.indexOf(Ext.getCmp('mainapp').getActiveItem());
		this.main.setActiveItem(5,{type: 'slide', direction: 'left'});
		Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].setText(title);
	},
	showInfo: function(dv,idx) {
		if (this.delayedTask !== undefined) {
			this.delayedTask.cancel();
			this.delayedTask = undefined;
		}
		var node=dv.getStore().getAt(idx);
		this.popup=new nagios.views.servicepopup({
			html:nagiosTemplates[node.data.nagios_type].apply( node.data ),
			node:node
		});
		if(node.data.notifications_enabled)
		{
			this.popup.dockedItems.items[1].items.items[1].setText('Disable Alerts')			
		}
		else
		{
			this.popup.dockedItems.items[1].items.items[1].setText('Enable Alerts')						
		}
		this.popup.show('pop');
		this.doubletap=true;
	},
	getUser: function(){		
		// Load the user info syncronously
		var userquery= 'GET contacts|Columns: can_submit_commands email alias name pager in_service_notification_period host_notification_period service_notification_period in_host_notification_period host_notifications_enabled service_notifications_enabled |Filter: name = USERNAME';

		var url=NagUI.url + '?query=' + userquery,
		fileName = url.split('/').pop(),
		xhr, status, onScriptError;

		if (typeof XMLHttpRequest !== 'undefined') {
		    xhr = new XMLHttpRequest();
		} else {
		    xhr = new ActiveXObject('Microsoft.XMLHTTP');
		}

		xhr.open('GET', url, false);
		xhr.send(null);

		status = (xhr.status === 1223) ? 204 : xhr.status;

		if (status >= 200 && status < 300) {

			var data=Ext.decode(xhr.responseText);
			var newrow={
				label: 'Login: ' + data[0].name,
				status: 'read-only access'
			};
			if(data[0].can_submit_commands)
			{
				NagUI.username=data[0].name;
				NagUI.nagios_write=true;
				newrow.status='read-write enabled';
			}
			this.main.items.items[0].items.items[0].getStore().add(newrow);
		}
		else {
		    onError.call(this, "Failed loading user info via XHR: '" + url + "'; " +
		                       "XHR status code: " + status);
		}
		// done getting user info
	},
	show: function() {
	},
	doSearch: function(q){
		this.main.setActiveItem(2,{type: 'slide', direction: 'left'});
		this.main.getActiveItem().items.items[0].getStore().load({params:{query: '|Filter: name ~~ ' + q + '|Filter: address ~~ ' + q +'|Filter: alias ~~ ' + q + '|Or: 3'}});
		Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].setText('Results');
	},
	onFilter: function(values,form) {
		var view = this.main,
			store = view.store,
			filters = [],
			field;
			Ext.iterate(values, function(field, value) {
				filters.push(new Ext.util.Filter({
					property: field,
					value   : value
				}));
			});
			store.clearFilter();
			store.filter(filters);
	},
	onTap: function(dv,idx){
		if (this.delayedTask === undefined) {
			this.delayedTask = new Ext.util.DelayedTask(function () {
				this.delayedTask = undefined;
				this.onSelected(undefined,[dv.getStore().getAt(idx)]);
				
					// .. singletap action ..
					
		    }, this);
		}
		this.delayedTask.delay(200);
	},
	// addHostnameToService: function(records){
	// 	this.main.getActiveItem().items.items[0].getStore().each(function(r){
	// 		console.log(r);
	// 		console.log(r.set('label',r.get('host_name') + ': ' + r.get('label'))); 
	// 	});
	// 	this.main.getActiveItem().items.items[0].getStore().fireEvent('datachanged', this.main.getActiveItem().items.items[0].getStore());
	//         
	// },
	onSelected: function(selectionModel, records) {
		var selection = records[0];
		if (selection) {
			if(typeof selection.data.nagios_type=='undefined')
			{
				this.main.setActiveItem(selection.data.target,{type: 'slide', direction: 'left'});
				var req_conf={
					params:{
						query: selection.data.query,
						groupby: 'name'
					}
				};
				if(selection.data.label=='Svc Problems')
				{
					req_conf.params.nodetext='hostsvc';
					req_conf.params.groupby='';
				}
				if(selection.data.label=='Host Problems')
				{
					req_conf.params.nodetext='name';
					req_conf.params.groupby='';
				}
				this.main.getActiveItem().items.items[0].getStore().load(req_conf);
				Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].setText(selection.data.label);
			}			
			if(selection.data.nagios_type=='hostgroup')
			{
				this.main.setActiveItem(2,{type: 'slide', direction: 'left'});
				this.main.getActiveItem().items.items[0].getStore().load({params:{query: '|Filter: groups >= ' + selection.data.label}});
				Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].setText(selection.data.label);
			}			
			if(selection.data.nagios_type=='host')
			{
				this.main.setActiveItem(3,{type: 'slide', direction: 'left'});
				this.main.getActiveItem().items.items[0].getStore().load({params:{query: '|Filter: host_name ~~ ' + selection.data.label}});
				Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].setText(selection.data.label);
			}			
		}
	},

	ackWindow: function(n){
		if(!NagUI.nagios_write) {
			alert('write commands not allowed');
			return;
		}
		var title;
		if(n.length > 0)
		{
			title='Batch Ack';
		}
		else
		{
			if(n.state==0 && n['host_name']!='undefined')
			{
				Ext.Msg.alert('N/A','This service is not ack-able');
				return;
			}
			title= n.nagios_type=='host' ? n.name : n.host_name + ' : ' + n.description;
		}
		this.main.setActiveItem(4,{type: 'slide', direction: 'left'});
		this.main.items.items[4].ackTarget={data:n};
		this.main.items.items[4].returnPanel = Ext.getCmp('mainapp').items.indexOf(Ext.getCmp('mainapp').getActiveItem());
		Ext.getCmp('mainapp').getActiveItem().dockedItems.items[0].items.items[2].setText(title);
	},
	sendAck: function(){
		var t=this.main.items.items[4].ackTarget;
		var formData=this.main.items.items[4].items.items[0].getValues();
		// console.log(formData);
		// return;
		this.main.setActiveItem(3,{type: 'slide', direction: 'right'});
		if(typeof ackTicket=='function' && formData.ticket=='on')
		{
			//PP.log('creating ticket');
			//PP.log(formData);
			ackTicket(t,formData,function(k,d,msgObj){
				formData.ack_text+=' ' + k;
				sendNagiosCommand(ackNodeString(t,formData));
				// if(typeof d !='undefined')
				// {
					Ext.getCmp('mainapp').getActiveItem().setLoading(false);
				// }
				Ext.Msg.show(msgObj);		
			},function(){
				Ext.getCmp('mainapp').getActiveItem().setLoading(true);
			});
		}
		else
		{
			sendNagiosCommand(ackNodeString(t,formData));
		}
		
	},
	sendScheduledDowntime: function(){
		var t=this.main.items.items[5].scheduleTarget;
		var formData=this.main.items.items[5].items.items[0].getValues();
		// console.log(formData);
		// return;
		this.main.setActiveItem(this.main.items.items[5].returnPanel,{type: 'slide', direction: 'right'});
		// console.log(scheduleNodeString(t,formData));
		sendNagiosCommand(scheduleNodeString(t,formData));
	}
	
});


