$(function() {
  // Application and helpers
  var Application = {
    cached_template: null,

    // Get our template for a realm block from _template.html.
    // Cache this so we only need to fetch it once.
    template: function() {
      if(Application.cached_template) {
        return Application.cached_template;
      } else {
        path = location.pathname
        Application.cached_template = $.ajax({
          url: path.substring(0, path.lastIndexOf('/')) + "/_template.html",
          async: false
        }).responseText;
        return Application.cached_template;
      }
    },

    // Create or update the realm list from the API.
    update_realms: function() {
      $("#loading").show();

      $.getJSON("http://us.battle.net/api/wow/realm/status?jsonp=?", {cache: false}, function(data) {
        $.each(data.realms, function(i, realm) {
          realm.type = Application.TemplateHelpers.proper_realm_type(realm.type);
          realm.status = realm.status ? "Up" : "Down";
          realm.population = Application.TemplateHelpers.proper_realm_population(realm.population);
          realm.queue = realm.queue ? "Yes" : "No";
          var view = Milk.render(Application.template(), realm);

          realm_el_id = "#realm-" + realm.slug;

          if($("#main " + realm_el_id).length > 0) {
            console.log("Replacing");
            $("#main " + realm_el_id).html(view);
          } else {
            console.log("Adding");
            $("#main").append($(view));
          }
        });

        $("#loading").hide();
        $("#time span").html(Application.TemplateHelpers.get_time());

        window.setTimeout(Application.update_realms, 1000 * 60 * 5); // reload every 5 minutes

        // now that the data is loaded (potentiall for the first time),
        // check to see if there is a hash in the URL we should use to search
        Searcher.search_by_hash();
      });
    },

    // Some helpers to modify strings, etc.
    TemplateHelpers: {
      proper_realm_type: function(type) {
        switch(type) {
        case "pve":
          return "PvE";
        case "pvp":
          return "PvP";
        case "rp":
          return "RP";
        case "rppvp":
          return "RP PvP";
        default:
          return type;
        }
      },

      proper_realm_population: function(population) {
        switch(population) {
        case "low":
          return "Low";
        case "medium":
          return "Medium";
        case "high":
          return "High";
        default:
          return population;
        }
      },

      // Get a 12-hour string representation of the current time.
      get_time: function() {
        var now = new Date();

        var hours    = now.getHours();
        var minutes  = now.getMinutes();
        var meridian = hours < 12 ? "AM" : "PM"
        if(hours > 12) {
          hours -= 12;
        }
        if(hours == 0) {
          hours = 12;
          meridian = "AM"
        }
        if(minutes < 10) {
          minutes = "0" + minutes;
        }

        return hours + ":" + minutes + " " + meridian;
      }
    }
  }

  // Search bar and URL hash
  var Searcher = {
    do_search: function(value) {
      search = value;
      window.location.hash = value;
      if(search == "") {
        return Searcher.show_all();
      }

      $(".realm").each(function(index, element) {
        realm_name = $(this).data("name");
        if(realm_name.startsWith(search)) {
          $(this).addClass('search_shown');
          $(this).removeClass('search_hidden');
        } else {
          $(this).addClass('search_hidden');
          $(this).removeClass('search_shown');
        }
      });
    },

    show_all: function() {
      $(".realm").removeClass('search_hidden');
      $(".realm").removeClass('search_shown');
    },

    search_by_hash: function() {
      if(hash = window.location.hash) {
        hash = hash.substring(1);
        $("#search input").val(hash);
        Searcher.do_search(hash);
      }
    }
  }

  // Method to determine if a string starts with a another string.
  // Optional case sensitivity defaults to false.
  String.prototype.startsWith = function(other, case_cmp) {
    var first  = this;
    var second = other;

    if(!case_cmp) {
      first  = first.toLowerCase();
      second = second.toLowerCase();
    }

    return (first.indexOf(second) === 0);
  }

  $("#search input").focus();

  $("#realm-searcher").bind("keyup", function() {
    Searcher.do_search($(this).val());
  });

  $(".realm a").live("click", function(event) {
    event.preventDefault();
    realm = $(this).closest(".realm").data("name");
    $("#search input").val(realm);
    window.location.hash = realm;
    Searcher.do_search(realm);
  });

  Application.update_realms();
});