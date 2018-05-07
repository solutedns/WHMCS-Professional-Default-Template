/**********************************************
 
 *** SoluteDNS PRO for WHMCS ***
 
 File:					template/js/admin.js
 File version:			3.18.001
 
 Copyright (C) NetDistrict 2016-2018
 All Rights Reserved
 
 **********************************************/
function sendData(json) {

    NProgress.start();

    if (typeof time1 !== 'undefined') {
        clearTimeout(time1);
    }
    if (typeof time2 !== 'undefined') {
        clearTimeout(time2);
    }

    $.ajax({
        data: {
            'data': json
        },
        url: location.protocol + '//' + location.host + location.pathname + '?module=solutedns&action=post',
        method: "POST",
        success: function(data) {

            var result = JSON.parse(data);

            if (result) {
                result.forEach(function(data) {

                    setMessage(data['title'], data['msg'], data['status'], data['tablereload'], data['pagereload'], data['fieldreset'], data['msgReset'], data['fixed'], data['errorFields'])

                    if (data['syscheck'] == true) {
                        syscheck();
                    }

                    if (typeof data['field'] !== 'undefined') {
                        setErrorField(data['field']);
                    }

                });
            }

            NProgress.done();

        }
    });

}

function getData(json) {

    NProgress.start();

    if (typeof time1 !== 'undefined') {
        clearTimeout(time1);
    }
    if (typeof time2 !== 'undefined') {
        clearTimeout(time2);
    }

    $.ajax({
        data: {
            'data': json
        },
        url: location.protocol + '//' + location.host + location.pathname + '?module=solutedns&action=get',
        method: "GET",
        success: function(data) {

            var result = JSON.parse(data);

            if (result) {
                processData(result);
            }

            NProgress.done();

        }
    });

}

function setMessage(title, desc, status, tableReload, pageReload, fieldReset, msgReset, fixed, errorFields) {

    /* Message Reset */
    if (msgReset == true) {
        resetMessages();
    }

    /* Generate Unique ID */
    var id = '4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    /* Set message state */
    if (status == 'error') {
        var state = 'alert2 alert2-danger';
    } else {
        var state = 'alert2 alert2-' + status;
    }

    /* Add Message */
    $('#msgConsole').append('<div id=' + id + ' style="display: none;" class="' + state + '"><div><h4>' + title + '</h4></div><div><p>' + desc + '</p></div></div>');

    /* Display Message */
    $("#" + id).show("slow", function() {
        $('html, body').animate({
            scrollTop: $("#msgConsole").offset().top - 10
        }, 400);
        if (fixed != true) {
            setTimeout(function() {
                $("#" + id).hide("slow");
            }, 8000);
            setTimeout(function() {
                $("#" + id).remove();
            }, 8500);
        }
    });

    /* Reload Table Date */
    if (tableReload == true) {
        SDNS_zoneTable.fnReloadAjax();
    }

    /* Reload Page */
    if (pageReload == true) {
        setTimeout(function() {
            location.reload()
        }, 2000);
    }

    /* Reset Field Entries */
    if (fieldReset == true) {
        clearFields();
        resetDNSField();
        resetAddzone();
    }

    /* Set Error Field */
    setErrorMark(errorFields);

}

function updateSettings(element) {
    var fields = $("#" + element + " :input").serializeArray();
    var data = JSON.stringify(fields);

    sendData(data)
}

function updateInit(element, tab) {
    var fields = $("#" + element + " :input").serializeArray();
    var data = JSON.stringify(fields);

    data = sendData(data);

    $('.nav-tabs a[href="#' + tab + '"]').tab('show');

    var progress = 10;

    if (tab == 'eula') {
        progress = 10;
    }
    if (tab == 'license') {
        progress = 20;
    }
    if (tab == 'nameserver') {
        progress = 40;
        $("#sdns_license_field").removeClass("has-error");
    }
    if (tab == 'nameserver2') {
        progress = 50;
    }
    if (tab == 'index') {
        progress = 70;
    }

    $("#dynamic")
        .css("width", progress + "%")
        .attr("aria-valuenow", progress)
    //.text(progress + "% Complete");


}

function resetMessages() {

    /* Clear Message Box */
    $("#msgConsole").empty();

    /* Retrieve System Messages */
    getState();

    if ($("#sdns_zone").val().length > 0) {
        getZoneState();
    }

}

function getState(zone) {

    var item = {
        action: 'systemState',
        zone: zone,
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function setErrorMark(fields) {

    /* Remove previous set errors */
    $(".col-md-1 div").removeClass("has-error");
    $(".col-md-2 div").removeClass("has-error");
    $(".col-md-3 div").removeClass("has-error");
    $(".col-md-9 div").removeClass("has-error");

    if (fields != null) {

        /* Add error to selected fields */
        var fields = fields.split(",");

        fields.forEach(function(field) {
            $("#" + field + "_field").addClass("has-error");;
        });

    }

}

function processData(result) {

    if (result.data == 'template') {

        if (result.enabled) {
            $("#sdns_dns_product").prop("checked", true);
        } else {
            $("#sdns_dns_product").prop("checked", false);
        }

        if (result.force) {
            $("#sdns_force_template").prop("checked", true);
        } else {
            $("#sdns_force_template").prop("checked", false);
        }

    }

}

function isDataTable(nTable) {
    return $.fn.DataTable.fnIsDataTable('#' + nTable);
}

function selectOverview(value) {
    SDNS_zoneTable.fnDestroy();
    drawTable('sdns_overview_zones', value);
}

function selectTemplate(value) {
    SDNS_zoneTable.fnDestroy();

    if (value != 0) {
        $("#sdns_template_product").val(value);
        $("#templatesettings").removeClass("hidden");

        var item = {
            action: 'template',
            data: value,
        };

        jsonString = JSON.stringify(item);
        getData(jsonString);

    } else {
        $("#sdns_template_product").val('0');
        $("#templatesettings").addClass("hidden");
    }
    drawRecords('sdns_template_records', value);
}

function autoSave(type, field, data) {

    if (type == 'template') {
        var send = {
            id: $("#sdns_template_product").val(),
            field: field,
            value: data.checked,
        }
    }

    var item = {
        action: 'autosave',
        type: type,
        data: send,
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function edit(id) {

    /* Reset previous selected field */
    resetDNSField();

    /* Enable current fields */
    $('#sdns_name_' + id).prop('disabled', false);
    $('#sdns_type_' + id).prop('disabled', false);
    $('#sdns_content_' + id).prop('disabled', false);
    $('#sdns_prio_' + id).prop('disabled', false);
    $('#sdns_ttl_' + id).prop('disabled', false);

    $('#sdns_edit_' + id).hide();
    $('#sdns_save_' + id).show();

    setRecord(id);

}

function resetDNSField() {

    var id = $("#sdns_record").val();

    if (id > 1) {
        /* Disable previous fields */
        $('#sdns_name_' + id).prop('disabled', true);
        $('#sdns_type_' + id).prop('disabled', true);
        $('#sdns_content_' + id).prop('disabled', true);
        $('#sdns_prio_' + id).prop('disabled', true);
        $('#sdns_ttl_' + id).prop('disabled', true);

        $('#sdns_save_' + id).hide();
        $('#sdns_edit_' + id).show();
    }
}

function deleteSelected() {

    var deleteArray = [];

    $("input:checkbox[name=sdns_select]:checked").each(function() {
        deleteArray.push($(this).val());
    });

    var zone = $("#sdns_zone").val();
    var records = deleteArray;

    var data = {
        action: 'deleteselectedrecords',
        zone: zone,
        records: records
    };

    jsonString = JSON.stringify(data);

    sendData(jsonString);

}

function setErrorField(field) {
    var record_id = $("#sdns_record").val();

    $("#sdns_z-" + field + "_" + record_id).addClass("has-error");
}

function clearFields() {
    $("#sdns_name_0").val("");
    $("#sdns_content_0").val("");
    $("#sdns_prio_0").val("");
}

function clearErrorField() {

    var record_id = $("#sdns_record").val();

    $("#sdns_z-name_" + record_id).removeClass("has-error");
    $("#sdns_z-type_" + record_id).removeClass("has-error");
    $("#sdns_z-content_" + record_id).removeClass("has-error");
    $("#sdns_z-prio_" + record_id).removeClass("has-error");
    $("#sdns_z-ttl_" + record_id).removeClass("has-error");

}

function record_add(type) {

    setRecord(0);
    clearErrorField()

    var zone = $("#sdns_zone").val();

    var var1 = $("#sdns_name_0").val();
    var var2 = $("#sdns_type_0").val();
    var var3 = $("#sdns_content_0").val();
    var var4 = $("#sdns_prio_0").val();
    var var5 = $("#sdns_ttl_0").val();

    if (type == 'template') {
        zone = $("#sdns_template").val();
        var item = {
            action: 'addtemplate',
            zone: zone,
            name: var1,
            type: var2,
            content: var3,
            prio: var4,
            ttl: var5,
        };
    } else {
        var item = {
            action: 'addrecord',
            zone: zone,
            name: var1,
            type: var2,
            content: var3,
            prio: var4,
            ttl: var5
        };
    }

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function record_edit(type, record_id) {

    clearErrorField()

    var zone = $("#sdns_zone").val();

    var var1 = $("#sdns_name_" + record_id).val();
    var var2 = $("#sdns_type_" + record_id).val();
    var var3 = $("#sdns_content_" + record_id).val();
    var var4 = $("#sdns_prio_" + record_id).val();
    var var5 = $("#sdns_ttl_" + record_id).val();

    if (type == 'template') {
        var item = {
            action: 'edittemplate',
            zone: zone,
            record_id: record_id,
            name: var1,
            type: var2,
            content: var3,
            prio: var4,
            ttl: var5,
        };
    } else {
        var item = {
            action: 'editrecord',
            zone: zone,
            record_id: record_id,
            name: var1,
            type: var2,
            content: var3,
            prio: var4,
            ttl: var5
        };
    }

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function record_delete(type) {

    var zone = $("#sdns_zone").val();
    var record_id = $("#sdns_record").val();

    if (type == 'template') {
        var item = {
            action: 'deletetemplate',
            record_id: record_id,
        };
    } else {
        var item = {
            action: 'deleterecord',
            zone: zone,
            record_id: record_id
        };
    }

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function ExportZone(zone) {

    var item = {
        action: 'export',
        zone: zone
    };

    jsonString = JSON.stringify(item);

    $.ajax({
        data: {
            'data': jsonString
        },
        url: location.protocol + '//' + location.host + location.pathname + '?module=solutedns&action=post',
        method: "GET",
        success: function(data) {
            jQuery("textarea#textarea_export").val(data);
        },
        error: function(data) {
            jQuery("textarea#textarea_export").val('Error could not load zone.');
        }
    });
}

function importZone() {

    var action = 'import';
    var zone = $("#sdns_zone").val();
    var zonedata = $("#textarea_import").val();
    var overwrite = $('#overwrite').is(":checked");

    var item = {
        action: action,
        zone: zone,
        bind: zonedata,
        overwrite: overwrite
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function applyTemplate() {

    var action = 'applytemplate';
    var zone = $("#sdns_zone").val();
    var template = $("#sdns_apply_template").val();

    var item = {
        action: action,
        zone: zone,
        template: template
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function zone_delete(id) {

    var action = 'deletezone';
    var zone = id;

    if (zone == null) {
        zone = $('#sdns_zone').val();
    }

    var item = {
        action: action,
        zone: zone
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function dnssec(action, zone, key) {

    var item = {
        action: 'dnssec_' + action,
        zone: zone,
        key: key
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function dnssec_addkey(zone) {

    var flag = $('#sdns_dnssec_flag').val();
    var bits = $('#sdns_dnssec_bits').val();
    var algorithm = $('#sdns_dnssec_algorithm').val();

    var item = {
        action: 'dnssec_addkey',
        zone: zone,
        flag: flag,
        bits: bits,
        algorithm: algorithm
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function health(action, zone) {

    var item = {
        action: 'health_' + action,
        zone: zone
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function setRecord(id) {
    $("#sdns_record").val(id);
}

function setZone(id) {
    $("#sdns_zone").val(id);
}

function setZoneName(name) {
    $('#sdns_zone_name span').text(name);
}

function setTemplate(id) {
    $("#sdns_template_id").val(id);
}

function syscheck(type) {

    var item = {
        action: 'systemCheck',
        type: type,
    };

    jsonString = JSON.stringify(item);

    sendData(jsonString);

}

function resetAddzone() {
    $('#sdns_addzone_type').val('');
    $('#sdns_addzone_client').val('');
    $('#sdns_addzone_domain').val('');
    $('#sdns_addzone_ip').val('');

    $('#add_client').hide();
    $('#add_domain').hide();
    $('#add_reverse').hide();
}

function domainResults() {

    $('#add_domain .typeahead').typeahead('destroy');

    vars.domainResults = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: 'addonmodules.php?module=solutedns&action=search&domain&client=' + $('#sdns_addzone_client').val() + '&type=' + $('#sdns_addzone_type').val() + '&query=%QUERY',

        remote: {
            url: 'addonmodules.php?module=solutedns&action=search&domain&client=' + $('#sdns_addzone_client').val() + '&type=' + $('#sdns_addzone_type').val() + '&query=%QUERY',
            wildcard: '%QUERY'
        }
    });

    $('#add_domain .typeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    }, {
        name: 'domainResults',
        /*display: ''*/
        source: vars.domainResults,
        limit: 8
    })

}

/* DNS Assistant */

function dnsassist(type) {
    var action = 'dnsassist';
    var zone = $("#sdns_zone").val();

    if (type == 'srv') {

        var item = {
            action: action,
            type: 'srv',
            zone: zone,
            service: $("#sdns_srv_service").val(),
            protocol: $("#sdns_srv_protocol").val(),
            ttl: $("#sdns_srv_ttl").val(),
            priority: $("#sdns_srv_priority").val(),
            weight: $("#sdns_srv_weight").val(),
            target: $("#sdns_srv_target").val(),
            port: $("#sdns_srv_port").val()
        };
    }

    if (type == 'tlsa') {

        var item = {
            action: action,
            type: 'tlsa',
            zone: zone,
            usage: $('input[name=sdns_tlsa_usage]:checked').val(),
            selector: $('input[name=sdns_tlsa_selector]:checked').val(),
            matching_type: $('input[name=sdns_tlsa_type]:checked').val(),
            cert: $("#sdns_tlsa_certificate").val(),
            port: $("#sdns_tlsa_port").val(),
            protocol: $("#sdns_tlsa_protocol").val(),
            name: $("#sdns_tlsa_name").val()
        };

    }

    jsonString = JSON.stringify(item);

    sendData(jsonString);
}

/* SoluteDNS Console */

var source = 'runner';

function start_com(e, type) {
    if (!console.isRunning) {

        $('#console-close').prop('disabled', true);
        $('#console-close').html("<i class=\"glyphicon glyphicon-refresh icon-spinner\"></i>");
        $('#console-close').removeClass('btn-success');
        $('#console-close').addClass('btn-default');

        $("#results").append('<br/>Loading script... <br/><br/>');
        var scroller = setInterval(function() {
            var el = document.getElementById('results');
            el.scrollTop = el.scrollHeight;
        }, 120);

        if (document.URL.indexOf('#') === -1) {
            var URL = document.URL;
        } else {
            var URL = document.URL.substring(0, document.URL.indexOf('#'));
        }

        if (type == 'mutation') {

            var data = {
                type: $("#sdns_mut_for").val(),
                server: $("#sdns_mut_server").val(),

                action: $("#sdns_mut_action").val(),

                where_type: $("#sdns_mut_where_type").val(),
                where_content: $("#sdns_mut_where_content").val(),
                where_ttl: $("#sdns_mut_where_ttl").val(),
                where_prio: $("#sdns_mut_where_prio").val(),

                content_type: $("#sdns_mut_content_type").val(),
                content_content: $("#sdns_mut_content_content").val(),
                content_ttl: $("#sdns_mut_content_ttl").val(),
                content_prio: $("#sdns_mut_content_prio").val()
            };

            source = new EventSource(URL + '&action=console&console=' + type + '&data=' + JSON.stringify(data));
        } else {
            source = new EventSource(URL + '&action=console&console=' + type);
        }

        source.addEventListener('message', function(e) {
            var result = JSON.parse(e.data);

            add_log(result.message);
            add_status(result.status);

            $("#progressbar").width(result.progress + '%');

            if (e.data.search('READY') != -1) {
                source.close();
                clearTimeout(scroller)
                var el = document.getElementById('results');
                el.scrollTop = el.scrollHeight;
                $('#console-close').prop('disabled', false);
                $('#console-close').text("Close");
                $('#console-close').addClass('btn-success');
                $('#console-close').removeClass('btn-default');
                delete console.isRunning;
            }
        });

        source.addEventListener('error', function(e) {

            add_log('Error occured');
            source.close();
            clearTimeout(scroller)
            var el = document.getElementById('results');
            el.scrollTop = el.scrollHeight;
            $('#console-close').prop('disabled', false);
            $('#console-close').text("Close");
            $('#console-close').addClass('btn-success');
            $('#console-close').removeClass('btn-default');
            delete console.isRunning;
        });

        console.isRunning = true;

    }

    function add_log(message) {
        $("#results").append(message + '<br/>');

        if (message != 'READY') {
            $('#console-job span').html(message);
        }
    }

    function add_status(message) {
        if (message) {
            $('#console-status span').text(message);
        }
    }

    function strip(html) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText;
    }

}

function console(type) {
    if (typeof(EventSource) !== "undefined") {
        start_com(null, type);
    }
}

function console_name(name) {
    $('h4#dialog_console_title').text(name);
}


$(document).ready(function() {

    /* Javascript to enable link to tab */
    var url = document.location.toString();
    if (url.match('#')) {
        $('.nav-tabs a[href="#' + url.split('#')[1] + '"]').tab('show');
        var atab = url.split('#')[1];
    }

    /* HTML5 Prevent scrolling! */
    $('.nav-tabs a').on('shown.bs.tab', function(e) {
        if (history.pushState) {
            history.pushState(null, null, e.target.hash);
        } else {
            window.location.hash = e.target.hash; //Polyfill for old browsers
        }
    })

    /* Activate tooltip */
    $(function() {
        $('[data-toggle="tooltip"]').tooltip({
            container: 'body',
            html: true,

            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner large"></div></div>'

        })
    })

    /* Disable Console if EventSource not supported */
    if (typeof(EventSource) !== "undefined") {} else {
        $('#console-job span').text("Your browser does not support the console output.");
        $('#console-status span').text("Console not supported");
    }

    /* Load table of active tab  */
    if (atab == 'templates') {
        drawRecords('sdns_template_records')
    } else if (atab == 'overview' || atab == 'index' || atab == null) {
        drawTable('sdns_overview_zones')
    } else if (document.URL.indexOf("server") != -1 || atab != null && atab != 'overview' && atab != 'templates') {
        // No table in active tab
    }

    /* Mutation Tool */
    $('.where_input').attr('disabled', 'disabled');
    $('#where_container').addClass("sdns_text_disabled");

    $('select[name="sdns_mut_action"]').on('change', function() {
        var others = $(this).val();

        if (others == "add") {
            $('.where_input').attr('disabled', 'disabled');
            $('.content_input').removeAttr('disabled');
            $('#where_container').addClass("sdns_text_disabled");
            $('#content_container').removeClass("sdns_text_disabled");
        }

        if (others == "edit") {
            $('.where_input').removeAttr('disabled');
            $('.content_input').removeAttr('disabled');
            $('#content_container').removeClass("sdns_text_disabled");
            $('#where_container').removeClass("sdns_text_disabled");
        }

        if (others == "delete") {
            $('.where_input').removeAttr('disabled');
            $('.content_input').attr('disabled', 'disabled');
            $('#content_container').addClass("sdns_text_disabled");
            $('#where_container').removeClass("sdns_text_disabled");
        } else {
            $('#disabled_input').attr('disabled', 'disabled');
        }

    });

});