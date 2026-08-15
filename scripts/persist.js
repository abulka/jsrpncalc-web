function PersistManager() {
    var DEFAULT_TITLE = "Current";
    var currentTitle = "";

    var storage = new CalcStorage();

    // Private Methods ------------------------

    function persistence_invalid() {
	return (storage.get_current_title() == undefined || storage.script_titles().length == 0);
	//return $.inArray(DEFAULT_TITLE, Object.keys(localStorage)) != -1;
    }

    function init_samples() {
	alert('DB re-initialised and sample data reset.');

	storage.set_current_title(DEFAULT_TITLE); // persist the current open file
	storage.zap();
	$("div#SampleScripts div").each(function(index) {
	    storage.insert_script($(this).attr('data-title'), $(this).text());
	});
	console.log(storage.script_titles());
	loadViewFromDisk();
    }


    if (persistence_invalid()) {
	init_samples();
    }


    function loadViewFromDisk() {
	// populate the local storage list view

	var $ul = $("ul#directoryList");
	$ul.empty();

	var titles = storage.script_titles();
	$(titles).each(function(index, keyname) {
	    $ul.append($('<li>', {
		text: keyname
	    }));
	});

	currentTitle = storage.get_current_title();
	$('span#current_title').text(currentTitle);
    }


    loadViewFromDisk();


    function get_editor_text() {
	return $("#code3")[0].value;
    }

    function set_editor_text(s) {
	$("#code3").val(s);
    }


    // Public Methods -------------------------

    function save() {
	var script = get_editor_text();
	storage.savescript(currentTitle, script);
    }

    function open(title) {
	currentTitle = title;
	storage.set_current_title(title); // persist the current open file
	reload()
    }

    function reload() {
	var s = storage.loadscript(currentTitle);
	set_editor_text(s);
    }

    function save_custom_button_mappings(mappings) {
	storage.save_mappings(mappings);
    }

    function get_current_mappings() {
	return storage.load_mappings();
    }

    // Return interface -----------------------

    return {
	open: open,
	save: save,
	reload: reload,
	get_editor_text: get_editor_text,
	init_samples: init_samples,
	save_custom_button_mappings: save_custom_button_mappings,
	get_current_mappings: get_current_mappings
    }

};


function CalcStorage() {

    // Creating an instance of this will automatically create a valid settings
    // entry in memory and localstorage.
    // The settings 'current_title' may be undefined
    // The DB may be empty of scripts records

    var KEY_DB = "db_jsrpncalc_scripts";
    var KEY_SETTINGS = "jsrpncalc_settings";

    var db = TAFFY();
    var settings = {};

    function init(db_key, settings_key) {
	// Passing the localstorage keys as parameters means we can store into
	// fresh databases for testing purposes.
	if (db_key == undefined) db_key = KEY_DB;
	if (settings_key == undefined) settings_key = KEY_SETTINGS;

	db.store(db_key); // merge db object with existing persistence.
	load_settings(); // load in settings object
    }

    init();

    function save_settings() {
	localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
    }

    function load_settings() {
	var settings_json = localStorage.getItem(KEY_SETTINGS);
	if (settings_json == undefined) {
	    settings = {
		'current_title': undefined,
		'wrap': {
		    'editor': true,
		    'viewer': false
		},
		'line_numbers': {
		    'editor': false,
		    'viewer': false
		}
	    }
	    save_settings();
	} else {
	    settings = JSON.parse(settings_json);
	}
    }

    // LOAD and SAVE TITLE SETTING

    function set_current_title(title) {
	settings.current_title = title;
	save_settings();
    }

    function get_current_title() {
	return settings.current_title;
    }

    // LOAD and SAVE SCRIPT to DB

    function savescript(title, s) {
	localStorage.setItem(title, s);
	var r = db({
	    title: get_current_title()
	});
	if (r == undefined || r.count() == 0) {
	    alert('new record being inserted');
	    insert_script(title, s);
	} else {
	    // update
	    r.update({
		"title": title,
		"script": s
	    });
	}
    }

    function loadscript(title) {
	if (title == undefined) {
	    alert('initialising with sample data');
	}
	var r = db({
	    title: get_current_title()
	});
	if (r == undefined || r.count() == 0) {
	    alert('no record for ' + title + ' found');
	    return null;
	} else {
	    return r.first().script;
	}
    }

    function script_titles(title) {
	return db().map(function(record, recordnumber) {
	    return record.title;
	}); // returns an array of titles
    }

    function insert_script(title, s) {
	db.insert({
	    "title": title,
	    "script": s,
	    "button_mappings": [],
	    "status": "ActiveZ"
	});
    }

    function zap() {
	var num_records_removed = db().remove();
	console.log('num_records_removed = ' + num_records_removed);
	return num_records_removed;
    }

    function save_mappings(mappings) {
	var r = db({
	    title: get_current_title()
	});
	r.update({
	    "button_mappings": mappings
	});
    }

    function load_mappings() {
	var r = db({
	    title: get_current_title()
	});
	return r.first().button_mappings;
    }

    return {
	set_current_title: set_current_title,
	get_current_title: get_current_title,
	loadscript: loadscript,
	savescript: savescript,
	zap: zap,
	script_titles: script_titles,
	insert_script: insert_script,
	save_mappings: save_mappings,
	load_mappings: load_mappings
    }
}