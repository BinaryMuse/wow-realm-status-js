(function() {
  String.prototype.startsWith = function(other, case_cmp) {
    var first, second;
    if (case_cmp == null) {
      case_cmp = false;
    }
    first = this;
    second = other || "";
    if (!case_cmp) {
      first = first.toUpperCase();
      second = second.toUpperCase();
    }
    return first.indexOf(second) === 0;
  };
  window.TextHelpers = {
    type: function(type) {
      switch (type) {
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
    population: function(pop) {
      switch (pop) {
        case "low":
          return "Low";
        case "medium":
          return "Medium";
        case "high":
          return "High";
        default:
          return pop;
      }
    },
    status: function(status) {
      if (status) {
        return "Up";
      } else {
        return "Down";
      }
    },
    queue: function(queue) {
      if (queue) {
        return "Yes";
      } else {
        return "No";
      }
    }
  };
  $(function() {
    _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g
    };
    window.Controller = Backbone.Controller.extend({
      routes: {
        ":realm": "realm"
      },
      realm: function(realm) {
        return Realms.filter(realm);
      }
    });
    window.Realm = Backbone.Model.extend({
      initialize: function() {
        if (this.get("name") == null) {
          return this.set({
            name: "unknown",
            slug: "unknown",
            type: "n/a",
            population: "n/a",
            queue: false,
            status: false
          });
        }
      }
    });
    window.RealmList = Backbone.Collection.extend({
      model: Realm,
      url: "http://us.battle.net/api/wow/realm/status?jsonp=?",
      initialize: function() {
        _.bindAll(this, 'update', 'parse', 'processUpdate', 'filter');
        return this.bind('refresh', function() {
          return this.refresh = this.processUpdate;
        });
      },
      update: function() {
        this.trigger('refresh:start');
        this.fetch();
        return window.setTimeout(this.update, 1000 * 60 * 5);
      },
      parse: function(response) {
        _.each(response.realms, function(realm) {
          return realm.id = realm.slug;
        });
        this.trigger('refresh:end');
        return response.realms;
      },
      processUpdate: function(models, options) {
        var list;
        list = this;
        return _.each(models, function(model) {
          var id, original_model;
          id = model.id;
          original_model = list.get(id);
          return original_model.set(model);
        });
      },
      filter: function(term) {
        return this.trigger('filter:change', term);
      }
    });
    window.RealmView = Backbone.View.extend({
      tagName: "div",
      template: _.template($("#realm_template").html()),
      initialize: function() {
        _.bindAll(this, 'render', 'show', 'hide');
        this.model.bind('change', this.render);
        return this.model.view = this;
      },
      render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      },
      show: function() {
        return $(this.el).show();
      },
      hide: function() {
        return $(this.el).hide();
      }
    });
    window.AppView = Backbone.View.extend({
      el: $("#main"),
      events: {
        "keyup input": "search"
      },
      initialize: function() {
        _.bindAll(this, 'addOne', 'addAll', 'search', 'initSearch', 'filter', 'startLoading', 'stopLoading', 'updateTime');
        Realms.bind('refresh', this.addAll);
        Realms.bind('refresh:start', this.startLoading);
        Realms.bind('refresh:end', this.stopLoading);
        Realms.bind('refresh:end', this.updateTime);
        Realms.bind('filter:change', this.filter);
        Realms.update();
        return this.initSearch();
      },
      addOne: function(realm) {
        var view;
        view = new RealmView({
          model: realm
        });
        return this.el.append(view.render().el);
      },
      addAll: function() {
        var view;
        view = this;
        _.each(Realms.models, function(realm) {
          if (realm.view == null) {
            return view.addOne(realm);
          }
        });
        return Backbone.history.start();
      },
      search: function() {
        return window.location.hash = this.$("input").val();
      },
      initSearch: function() {
        this.$("input").val(window.location.hash.substring(1));
        return this.$("input").focus();
      },
      filter: function(term) {
        this.$("input").val(term);
        if (term === "") {
          this.$("#reset").hide();
        } else {
          this.$("#reset").show();
        }
        return Realms.each(function(realm) {
          if (realm.get('name').startsWith(term)) {
            return realm.view.show();
          } else {
            return realm.view.hide();
          }
        });
      },
      startLoading: function() {
        return this.$("#loading img").show();
      },
      stopLoading: function() {
        return this.$("#loading img").hide();
      },
      updateTime: function() {
        var hours, meridian, minutes, now, seconds;
        now = new Date;
        hours = now.getHours();
        minutes = now.getMinutes();
        seconds = now.getSeconds();
        meridian = hours < 12 ? "AM" : "PM";
        if (hours > 12) {
          hours -= 12;
        }
        if (hours === 0) {
          hours = 12;
        }
        if (minutes < 10) {
          minutes = "0" + minutes;
        }
        if (seconds < 10) {
          seconds = "0" + seconds;
        }
        return this.$("#time span").text("" + hours + ":" + minutes + ":" + seconds + " " + meridian);
      }
    });
    window.Router = new Controller;
    window.Realms = new RealmList;
    return window.App = new AppView;
  });
}).call(this);
