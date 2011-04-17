$ ->
  String::startsWith = (other, case_cmp = false) ->
    first  = this
    second = other || ""

    unless case_cmp
      first  = first.toUpperCase()
      second = second.toUpperCase()

    first.indexOf(second) == 0

  # Some text helpers
  window.TextHelpers =
    type: (type) ->
      switch type
        when "pve"   then "PvE"
        when "pvp"   then "PvP"
        when "rp"    then "RP"
        when "rppvp" then "RP PvP"
        else type

    population: (pop) ->
      switch pop
        when "low"    then "Low"
        when "medium" then "Medium"
        when "high"   then "High"
        else pop

    status: (status) ->
      if status then "Up" else "Down"

    queue: (queue) ->
      if queue then "Yes" else "No"

  # Mustache style templates
  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
  };

  # Model for an individual realm
  window.Realm = Backbone.Model.extend
    initialize: ->
      if !this.get "name"
        this.set
          name:       "unknown"
          slug:       "unknown"
          type:       "n/a"
          population: "n/a"
          queue:      false
          status:     false

  # Model for a list of realms
  window.RealmList = Backbone.Collection.extend
    model: Realm
    url: "http://us.battle.net/api/wow/realm/status?jsonp=?"
    initialize: ->
      _.bindAll this, 'parse', 'update'
    update: ->
      this.trigger 'refresh:start'
      this.fetch()
    parse: (response) ->
      window.setTimeout this.update, 1000 * 60 * 5
      this.trigger 'refresh:end'
      response.realms

  window.Realms = new RealmList

  # View for an individual realm
  window.RealmView = Backbone.View.extend
    tagName: "div"
    template: _.template $("#realm_template").html()
    events:
      "click a": "filterRealm"
    initialize: ->
      _.bindAll this, 'render'
      this.model.bind 'change', this.render
      this.model.view = this
    render: ->
      $(this.el).html(this.template(this.model.toJSON()))
      this
    filterRealm: ->
      #

  # View for the application
  window.AppView = Backbone.View.extend
    el: $("#main")
    initialize: ->
      _.bindAll this, 'render', 'addOne', 'addAll', 'update_time', 'start_loading', 'stop_loading'
      Realms.bind 'add',     this.addOne
      Realms.bind 'refresh', this.addAll
      # Realms.bind 'all',     this.render
      Realms.bind 'refresh:start', this.update_time
      Realms.bind 'refresh:start', this.start_loading
      Realms.bind 'refresh:end', this.stop_loading
      Realms.update()
    addOne: (realm) ->
      view = new RealmView(model: realm)
      this.el.append view.render().el
    addAll: ->
      view = this
      _.each Realms.models, (data) ->
        view.addOne data
    render: ->
      # do nothing
    start_loading: ->
      this.$("#loading").show()
    stop_loading: ->
      this.$("#loading").hide()
    update_time: ->
      now      = new Date
      hours    = now.getHours()
      minutes  = now.getMinutes()
      seconds  = now.getSeconds()
      meridian = if hours < 12 then "AM" else "PM"

      hours   -= 12 if hours > 12
      hours    = 12 if hours == 0
      minutes  = "0#{minutes}" if minutes < 10
      seconds  = "0#{seconds}" if seconds < 10
      this.$("#time span").text("#{hours}:#{minutes}:#{seconds} #{meridian}")

  window.App = new AppView
