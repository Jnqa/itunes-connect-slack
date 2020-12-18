require 'spaceship'
require 'json'

def getVersionInfo(app)

	# puts app

	# puts app.get_edit_app_store_version

	# puts app.get_live_app_store_version

	editVersionInfo = app.get_edit_app_store_version
	liveVersionInfo = app.get_live_app_store_version

	# send app info to stdout as JSON
	version = Hash.new

	if editVersionInfo
		version["editVersion"] = {
			"name" => app.name,
			"version" => editVersionInfo.version_string,
			"status" => editVersionInfo.app_store_state,
			"appId" => app.id,
			"iconUrl" => editVersionInfo.store_icon
		}
	end

	if liveVersionInfo
		version["liveVersion"] = {
			"name" => app.name,
			"version" => liveVersionInfo.version_string,
			"status" => liveVersionInfo.app_store_state,
			"appId" => app.id,
			"iconUrl" => liveVersionInfo.store_icon
		}
	end

	return version
end

def getAppVersionFrom(bundle_id)
	versions = [] 
	
	# all apps
	apps = []
	if (bundle_id)
		app = Spaceship::ConnectAPI::App.find(bundle_id)
		apps.push(app)
	else 
		apps = Spaceship::ConnectAPI::App.all
	end
	
	for app in apps do
		version = getVersionInfo(app)
		versions.push(version)
	end
	return versions
end

# Constants
itc_username = ENV['itc_username']
itc_password = ENV['itc_password']
#split team_id
itc_team_id_array = ENV['itc_team_id'].to_s.split(",")
bundle_id = ENV['bundle_id']

if (!itc_username)
	puts "did not find username"
	exit
end

if (itc_password)
	Spaceship::ConnectAPI.login(itc_username,itc_password)
else
	Spaceship::ConnectAPI.login(itc_username)
end
# all json data
versions = [] 

#add for the team_ids
#test if itc_team doesnt exists

unless(itc_team_id_array.length.zero?)
	for itc_team_id in itc_team_id_array
		if (itc_team_id)
			Spaceship::ConnectAPI.client.team_id = itc_team_id
		end
		versions += getAppVersionFrom(bundle_id)
	end
else
	versions += getAppVersionFrom(bundle_id)
end




puts JSON.dump versions



