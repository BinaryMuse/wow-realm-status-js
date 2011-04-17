(function() {
  $(function() {
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
    _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g
    };
    window.Realm = Backbone.Model.extend({
      initialize: function() {
        if (!this.get("name")) {
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
        return _.bindAll(this, 'parse', 'update');
      },
      update: function() {
        this.trigger('refresh:start');
        return this.fetch();
      },
      parse: function(response) {
        window.setTimeout(this.update, 1000 * 60 * 5);
        this.trigger('refresh:end');
        return response.realms;
      }
    });
    window.Realms = new RealmList;
    window.RealmView = Backbone.View.extend({
      tagName: "div",
      template: _.template($("#realm_template").html()),
      events: {
        "click a": "filterRealm"
      },
      initialize: function() {
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
        return this.model.view = this;
      },
      render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      },
      filterRealm: function() {}
    });
    window.AppView = Backbone.View.extend({
      el: $("#main"),
      initialize: function() {
        _.bindAll(this, 'render', 'addOne', 'addAll', 'update_time', 'start_loading', 'stop_loading');
        Realms.bind('add', this.addOne);
        Realms.bind('refresh', this.addAll);
        Realms.bind('refresh:start', this.update_time);
        Realms.bind('refresh:start', this.start_loading);
        Realms.bind('refresh:end', this.stop_loading);
        return Realms.update();
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
        return _.each(Realms.models, function(data) {
          return view.addOne(data);
        });
      },
      render: function() {},
      start_loading: function() {
        return this.$("#loading").show();
      },
      stop_loading: function() {
        return this.$("#loading").hide();
      },
      update_time: function() {
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
    return window.App = new AppView;
  });
}).call(this);
