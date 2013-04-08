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

(function () {
    var originalOverwrite = Ext.XTemplate.prototype.overwrite;

    Ext.override(Ext.XTemplate, {
        overwrite: function () {
            //execute the base overwrite method
            originalOverwrite.apply(this, arguments);

            //then, render any components that addCmp might have added
            while (this.templateComponents.length > 0) {
                var el = this.templateComponents.shift();
                if (Ext.get(el.renderTo) != null) {
                    var newel = new Ext.create(el);
                }
            }
        },

        //an array to store the initialconfigs of the components-to-be
        templateComponents:[],

        //Pushes an initialConfig to the array so that
        //a component can be later created and rendered.
        //It also generates a div container for the component 
        //with a random id if no id was provided
        addCmp: function (initConfig) {
            var wrapperId = "ext-comp-wrapper-";
            if (initConfig.id != void (0)) {
                wrapperId += initialConfig.id;
            } else {
                wrapperId += Math.random().toString().replace(".", "");
            }
            initConfig.renderTo = wrapperId;
            this.templateComponents.push(initConfig);
            return '<div id="' + wrapperId + '"></div>';
        }
    });
})();
Ext.application({
	name: 'nagios',
	glossOnIcon: false,
	tabletStartupScreen: 'resources/images/tablet_startup.png',
    launch: function(){

    	Ext.create('NagUI.views.topview');
		// Ext.dispatch({
		// 	controller: 'overview',
		// 	action: 'list'
		// });
	}
});		

// Ext.setup({
// 	fullscreen:true,
// 	onReady: function(){
// 		NagUI.mobile=true;		
// 	}
// });
Ext.notify={
	msg:function(m) { Ext.Msg.alert(m); }
};
//Ext.MessageBox=Ext.Msg;


function toggleAlertString(n)
{
	var dt=new Date();
	dt=dt.format('U');
	var str='';
	var enabledisable='';
	str+='COMMAND ['+ dt + '] ';
	var enabledisable=(n.data.notifications_enabled == 1 ? 'DISABLE' : 'ENABLE') 
	
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
	return str;
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
	var start=new Date(opt.startdate.format('Y/m/d') + ' ' + opt.starttime + new Date().format('O')).format('U');
	var end=new Date(opt.enddate.format('Y/m/d') + ' ' +opt.endtime +new Date().format('O')).format('U');
	var dt=new Date();
	dt=dt.format('U');
	Ext.each(nodelist,function(n){
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

function sendNagiosCommand(str,method)
{
	Ext.Ajax.request({
		url: '/nagios/nagios_live.cgi',
		method: 'GET',
		params:{
			query: str
		},
		failure:function(r,o){
			Ext.Msg.alert('Error','There was an error sending a command');
		}
	});
	Ext.getCmp('mainapp').getActiveItem().setLoading(false);
//	Ext.Msg.alert(' Request Sent','');
}


