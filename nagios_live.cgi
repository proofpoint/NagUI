#!/usr/bin/perl
# /* Copyright 2010-2011 Proofpoint, Inc. All rights reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# */


use IO::Socket;
use lib '.';
use JSON;
use CGI;
use Monitoring::Livestatus;
use Fcntl qw(:flock);

# JSON version abstraction
sub eat_json {
   my ($json_text, $opthash) = @_;
    return ($JSON::VERSION > 2.0 ? from_json($json_text, $opthash) : JSON->new()->jsonToObj($json_text, $opthash));
}
sub make_json {
   my ($obj, $opthash) = @_;
    return ($JSON::VERSION > 2.0 ? to_json($obj, $opthash) : JSON->new()->objToJson($obj, $opthash));
}
## end JSON functions

# Load up config
open(CFG, '/opt/pptools/etc/nagui.conf') ||
open(CFG, '/etc/nagui.conf') ||
open(CFG, "$ENV{HOME}" . '/nagui.conf') ||
open(CFG, 'nagui.conf') ||
die "Cannot open configuration file $!\n";
my(@conf) = <CFG>;
close CFG;
my $config=eat_json(join("\n",@conf)) || die "Error parsing config file $!\n";

my $q=new CGI;
my $DEBUG=$config->{'debug'};

my $query=$q->param('query');
my $user=$ENV{REMOTE_USER};
my @valid_tables=qw( hosts services hostgroups servicegroups contactgroups servicesbygroup servicesbyhostgroup
	hostsbygroup contacts commands timeperiods downtimes comments log status columns );;

my $output;

$nagios_servers=$config->{'nagios_servers'};
my $peer;


# only query specified server otherwise query all servers
if($q->param('peer_name'))
{
	$peer=$nagios_servers->{$q->param('peer_name')};
}
else
{
	$peer=[];
	foreach(keys(%$nagios_servers))
	{
		push(@$peer,{name=>$_,peer=>$nagios_servers->{$_}});
	}
}

my $ml=Monitoring::Livestatus->new(
	#name=>'multisite',
	verbose=>0,
	timeout=>4,
	peer=>$peer,
	errors_are_fatal=>0,
	warnings=>0
	);


sub getUser()
{
	# my $options={ Slice => {}, Sum => 1, Deepcopy => 1, Addpeer=>1  };
	my $options={ Slice => {}, Deepcopy => 1, Addpeer=>1 };
	my $user_query="GET contacts|Columns: can_submit_commands email alias name pager in_service_notification_period host_notification_period service_notification_period in_host_notification_period host_notifications_enabled service_notifications_enabled |Filter: name = USERNAME";
	$user_query=~s/USERNAME/$user/sg;
	print STDERR "QUERY: $user_query\n" if $DEBUG;
	$user_query=~s/\|/\n/sg;
	my $user_obj=$ml->selectall_arrayref($user_query, $options);
	print STDERR "RESULT: $user_obj\n" if $DEBUG;
	my $write_access=JSON::false;
	print STDERR "CONFIG" . $config->{'write_access'};
	if($config->{'write_access'} eq 'all')
	{
		$write_access=JSON::true;
	}
	elsif($config->{'write_access'} eq 'contacts' && $$user_obj[0]->{'can_submit_commands'})
	{
		$write_access=$$user_obj[0]->{'can_submit_commands'};
	}
	elsif(ref $config->{'write_access'} eq 'ARRAY' && grep($ENV{REMOTE_USER},@{$config->{'write_access'}} ) )
	{
		$write_access=JSON::true;		
	}
	return {
		name => $ENV{REMOTE_USER},
		can_submit_commands => $write_access
	};
	
}

sub doCOMMAND()
{
	my $user_obj = &getUser();
	$query=~s/USERNAME/$user/sg;
	print STDERR "QUERY: $query" if $DEBUG;
	$query=~s/\|/\n/sg;
	if( $user_obj->{'can_submit_commands'} eq 'true' || $user_obj->{'can_submit_commands'} eq JSON::true)
	{
		my $res=$ml->selectall_arrayref($query,{ Slice => {}, Deepcopy => 1, Addpeer=>1  });
		print $q->header('application/json');
		print &make_json($res,{allow_nonref=>1});			
	}
	else
	{
		my $error={
			success => JSON::false,
			result => "error",
			message => "user cannot submit commands",
			general_message => "user cannot submit commands"
		};
		print $q->header(-type => 'application/json', -status => 401);
		print &make_json($error);
	}
}
	
# send the config to the client	
if($q->url_param('fetchconfig'))
{
	print $q->header('application/json');
	print &make_json($config);
}

# GET USER
if($q->url_param('getuser'))
{
	print $q->header('application/json');
	print &make_json(&getUser(),{allow_nonref=>1});
	exit;
	
}
	
# HANDLING FOR STATE FILE FETCHES
if($q->url_param('state'))
{

print STDERR "handling state for " . $ENV{'REQUEST_METHOD'} . "\n";
	# try to open the state as defined in the config
	open(STATE,$config->{'statefile'}); 
	my(@statefile) = <STATE>;
	my $state;
	# if there is a file with content, parse it into the state hash
	if(scalar(@statefile))
	{	
		$state=eat_json(join("\n",@statefile)) || die "Error parsing state file $!\n";
	}
	else
	{
		$state={ default_views => [] };
	}
	close CFG;
	
	# handle GETS on the state
	if($ENV{'REQUEST_METHOD'} eq 'GET')
	{
		if($q->url_param('state') eq 'default')
		{
			my $default_views=($state && defined($state->{'default_views'}) ? $state->{'default_views'} : []);
			print $q->header('application/json');
			print &make_json($default_views,{allow_nonref=>1});
		}
		else
		{
			my $user_views=($state && defined($state->{$user . '_views'}) ? $state->{$user . '_views'} : []);
			print $q->header('application/json');
			print &make_json($user_views,{allow_nonref=>1});
		}
	}
	# handle PUTS (updates) to the state
	if($ENV{'REQUEST_METHOD'} eq 'POST')
	{
		print STDERR "saving state\n";
		my $update=&eat_json($q->param('POSTDATA'),{allow_nonref=>1});
		if($q->url_param('state') eq 'default')
		{
			$state->{'default_views'}=$update;
		}
		else
		{
			$state->{$user . '_views'} = $update;
		}
		open(STATE, '>' . $config->{'statefile'}); 
		flock(STATE, LOCK_EX);
		print $q->header('application/json');
		print STATE &make_json($state,{allow_nonref=>1, pretty=>1});
		close STATE;
	}
	
	# this is probably never going to be used
	if($ENV{'REQUEST_METHOD'}  eq 'POST')
	{
		
	}
	
	exit;
}

# HANDLING FOR EXTERNAL COMMANDS SENT IN 
if($query=~/COMMAND/)
{
	doCOMMAND();
}

#special nagios status query.  does normal livestatus but does it separately for each server adn then combines
if($q->param('query') eq 'GET status')
{
	my $status_res=[];
	foreach(keys(%$nagios_servers))
	{
		my $st=Monitoring::Livestatus->new(
			name=> $_,			
			verbose=>0,
			timeout=>4,
			peer=>$nagios_servers->{$_},
			warnings=>0
			);
		$st->errors_are_fatal(0);
		my $res=$st->selectall_arrayref('GET status',{
			Slice => {}, 
			Sum => 1, 
			Deepcopy => 1,
			Addpeer=>1
		});
		# catch error and skip this iteration if connection fails
		if($Monitoring::Livestatus::ErrorCode) {
	        print STDERR "Livestatus Error: $Monitoring::Livestatus::ErrorMessage\n" if $DEBUG;
			push(@$status_res,{
				peer_name=>$_, 
				peer_addr=>$nagios_servers->{$_},
				error_code=>$Monitoring::Livestatus::ErrorCode,
				error_str=>$Monitoring::Livestatus::ErrorMessage
			});
			next;
	    }
	    
		$res->[0]->{'peer_name'}=$_;
		my $inst_res=$res->[0];
#		push(@$status_res,$inst_res);
#		next;
		# get host counts
		$res=$st->selectall_arrayref('GET hosts
Stats: state != 999
StatsGroupBy: active_checks_enabled',{
			Slice => {}, 
			Sum => 1, 
			Deepcopy => 1,
			Addpeer => 1
		});
		foreach(@$res)
		{
			$inst_res->{'hosts_active'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '1');
			$inst_res->{'hosts_passive'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '0');
		}
		# get service counts
		$res=$st->selectall_arrayref('GET services
Stats: state != 999
StatsGroupBy: active_checks_enabled',{
			Slice => {}, 
			Sum => 1, 
			Deepcopy => 1,
			Addpeer => 1
		});
		foreach(@$res)
		{
			$inst_res->{'services_active'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '1');
			$inst_res->{'services_passive'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '0');		
		}
		
		push(@$status_res,$inst_res);
	}
	print $q->header('application/json');
	print &make_json($status_res);
	exit;
}
# another special get status- this query is used to display the high level summary 
if($q->param('nagiosstatus'))
{
	my $hosts_q='GET hosts|Stats: state != 999|StatsGroupBy: active_checks_enabled';
	my $services_q='GET services|Stats: state != 999|StatsGroupBy: active_checks_enabled';
	$hosts_q=~s/\|/\n/sg;
	$services_q=~s/\|/\n/sg;
	my $host_res=$ml->selectall_arrayref($hosts_q,{ Slice => {},Sum=>1 , Deepcopy => 1, Addpeer=>1 });
	my $services_res=$ml->selectall_arrayref($services_q,{ Slice => {},Sum=>1 , Deepcopy => 1, Addpeer=>1 });
	my $status={
		hosts_active=>0,
		hosts_passive=>0,
		services_active=>0,
		services_passive=>0
	};
	foreach(@$host_res)
	{
		$status->{'hosts_active'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '1');
		$status->{'hosts_passive'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '0');
	}
	foreach(@$services_res)
	{
		$status->{'services_active'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '1');
		$status->{'services_passive'} = $_->{'state != 999'} if($_->{'active_checks_enabled'} eq '0');		
	}
	print $q->header('application/json');
	print &make_json([$status]);
	exit;
}

# Processing for normal livestatus queries
if($query=~/^GET/)
{
	$query=~/^GET\s(\w+)/;
	my $table=$1;
	unless(grep(/^$table$/,@valid_tables))
	{
		print $q->header( -type => 'application/json', -status => 405);
		
		print STDERR "INVALID QUERY: |$table| $query\n" if $DEBUG;
		exit;
	}
	
	$query=~s/USERNAME/$user/sg;

	if($query)
	{
		print STDERR "QUERY: $query" if $DEBUG;
		$query=~s/\|/\n/sg;
		my $options={ Slice => {}, Sum => 1, Deepcopy => 1, Addpeer=>1  };
		if($q->param('sum'))
		{
			$options->{sum} = 1;
		}
		if($query=~/GET\ hostgroups/)
		{
			$options->{sum} = 1;
		}
		my $res=$ml->selectall_arrayref($query, $options);
		if($q->param('groupby'))
		{
			my $new_res={};
			
			foreach my $rec (@$res)
			{
				foreach my $key (keys%$rec)
				{
					if($new_res->{ $rec->{$q->param('groupby')} } && $new_res->{ $rec->{$q->param('groupby')} }->{$key})
					{
						if($key eq $q->param('groupby'))
						{
							$new_res->{ $rec->{$q->param('groupby')} }->{$key} = $rec->{$key};
						}
						elsif($rec->{$key}=~/^\d+$/)
						{
							$new_res->{ $rec->{$q->param('groupby')} }->{$key} = $new_res->{ $rec->{$q->param('groupby')} }->{$key} + ( $rec->{$key} * 1 );
						}
						else
						{
							$new_res->{ $rec->{$q->param('groupby')} }->{$key} .= " " . $rec->{$key}; 
						}

					}
					else
					{
						$new_res->{  $rec->{$q->param('groupby')}  }->{$key} = $rec->{$key};
					}
				}
			}
			$res=[];
			foreach(keys(%$new_res))
			{
				push(@$res,$new_res->{$_});
			}
		}
#TODO normalize all these loops into one
		if($q->param('mode') eq 'treeloader' && $q->param('nodetext'))
		{
			foreach (@$res)
			{
				$_->{'text'}=$_->{$q->param('nodetext')};
				$_->{'leaf'}=JSON::true if $q->param('leaf');
				$_->{'checked'}=0;
#				$_->{'loader'}=$q->param('loader') if $q->param('loader');
			}
		}
		if($q->param('peer_name'))
		{
			foreach (@$res)
			{
					$_->{'peer_name'}=$q->param('peer_name');
			}
		}
		foreach (@$res)
		{
			$_->{'peer_name'}= $_->{'peer_name'} || $_->{'peer_name'};
			if($q->param('nodetext') eq 'hostsvc')
			{
				$_->{'text'}=$_->{'host_name'} . ' ' . $_->{'description'};					
			}
		}
		if($q->param('status'))
		{
			foreach (@$res)
			{
				if($q->param('nodetext') eq 'hostsvc')
				{
					$_->{'text'}=$_->{'host_name'} . ' ' . $_->{'description'};					
				}
				else
				{
					$_->{'text'}=defined $_->{$q->param('nodetext')} ? $_->{$q->param('nodetext')} : $q->param('nodetext');
				}
				if($q->param('status') eq 'statecount' )
				{				
					$_->{'status'}='OK: ' . $_->{'state = 0'} . ' Warn: '. $_->{'state = 1'} . ' Crit: ' . $_->{'state = 2'} . ' Unknown: ' .  $_->{'state = 3'} ;
					$_->{'num_services_ok'}=$_->{'state = 0'};
					$_->{'num_services_warn'}=$_->{'state = 1'};
					$_->{'num_services_crit'}=$_->{'state = 2'};
					$_->{'num_services_unknown'}=$_->{'state = 3'};
				}
				elsif($q->param('status') eq 'services' )
				{				
					$_->{'status'}='Hosts: ' . $_->{'num_hosts'} . ' ' if $_->{'num_hosts'};
					$_->{'status'}.='OK: ' . $_->{'num_services_ok'} . ' Warn: '. $_->{'num_services_warn'} . ' Crit: ' . $_->{'num_services_crit'} . ' Unknown: ' .  $_->{'num_services_unknown'} ;
					$_->{'status'}='';
				}
				elsif($q->param('status') eq 'service_count' )
				{				
					$_->{'status'}= $_->{'alias'} . ': ' . $_->{'num_services'};
				}
				elsif($q->param('status') eq 'problems')
				{
#					$_->{'text'}= $_->{'acknowledged'} == '0' ? 'Unhandled Problems' : 'Acknowledged';
					$_->{'status'}= 'Total: ' . $_->{'state > 0'} ;
					print STDERR "DEBUG" . make_json($_) if $DEBUG;
				}
				else
				{
					$_->{'status'}=$_->{'plugin_output'};					
				}
			}
			# if( scalar(@$res) == 0 )
			# {
			# 	push(@$res,{text=> $q->param('nodetext') , status=> 'Total: 0'});
			# }			
		}
		else
		{
			$_->{'status'}=$_->{'plugin_output'};					
		}
		print $q->header('application/json');

		print &make_json($res);
		exit;
	}

}
