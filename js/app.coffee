# Function to see if a string starts with another string.
String::startsWith = (other, case_cmp = false) ->
  first  = this
  second = other || ""

  unless case_cmp
    first  = first.toUpperCase()
    second = second.toUpperCase()

  first.indexOf(second) == 0

# Text helpers to format strings the way we want them.
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

$ ->
  # Use {{ Mustache-style }} templates
  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
  };

  # Router
  # ============================================================================
  window.Controller = Backbone.Controller.extend
    routes:
      ":realm": "realm"

    # Match any string in the hash tag to be the name of a realm to search for.
    realm: (realm)->
      Realms.filter(realm)

  # Model for an individual realm
  # ============================================================================
  window.Realm = Backbone.Model.extend
    initialize: ->
      # Only set default data if it doesn't already exist.
      unless this.get("name")?
        this.set
          name:       "unknown"
          slug:       "unknown"
          type:       "n/a"
          population: "n/a"
          queue:      false
          status:     false

  # Model for a list of realms
  # ============================================================================
  window.RealmList = Backbone.Collection.extend
    model: Realm
    url:   "http://us.battle.net/api/wow/realm/status?jsonp=?"

    initialize: ->
      _.bindAll this, 'update', 'parse', 'processUpdate', 'filter'
      # After the first refresh, we no longer want to replace the models
      # in the collection with new ones. Thus, we will use our own 'refresh'
      # method which simplu updates all the models with the new data.
      this.bind 'refresh', ->
        this.refresh = this.processUpdate

    # A wrapper around fetch() to (1) fire a "loading" event and
    # (2) ensure that a timer is set so another update happens in the future.
    update: ->
      this.trigger 'refresh:start' # Indicates data is being collected.
      this.fetch()
      window.setTimeout this.update, 1000 * 60 * 5 # update every 5 minutes

    # Custom parse method (1) extracts the array from Blizzard's JSON API and
    # (2) adds an "id" attribute to every model equal to that Realm's slug.
    parse: (response) ->
      _.each response.realms, (realm) ->
        realm.id = realm.slug
      this.trigger 'refresh:end' # Indicates data collection has ended.
      response.realms

    # Our replacement 'refresh' method, for every refresh after the first.
    # Iterates over the models in the collection and updates each one's data.
    processUpdate: (models, options) ->
      list = this
      _.each models, (model) ->
        id = model.id
        original_model = list.get(id)
        original_model.set(model)

    # Called by our controller when the hash tag changes.
    # We simply fire an event indicating the term has changed, and any view
    # that is interested will handle the work of hiding or showing elements.
    filter: (term) ->
      this.trigger 'filter:change', term

  # View for an individual realm
  # ============================================================================
  window.RealmView = Backbone.View.extend
    tagName:  "div"
    template: _.template $("#realm_template").html()

    initialize: ->
      _.bindAll this, 'render', 'show', 'hide'
      # Whenever the data changes, the view with automatically re-render itself.
      this.model.bind 'change', this.render
      this.model.view = this

    # Render a single realm based on the template embedded in the HTML.
    render: ->
      $(this.el).html(this.template(this.model.toJSON()))
      this

    show: ->
      $(this.el).show()

    hide: ->
      $(this.el).hide()

  # View for the application
  # ============================================================================
  window.AppView = Backbone.View.extend
    el: $("#main")
    events:
      "keyup input": "search"

    initialize: ->
      _.bindAll this, 'addOne', 'addAll', 'search', 'initSearch', 'filter', 'startLoading', 'stopLoading', 'updateTime'
      Realms.bind 'refresh',       this.addAll
      Realms.bind 'refresh:start', this.startLoading
      Realms.bind 'refresh:end',   this.stopLoading
      Realms.bind 'refresh:end',   this.updateTime
      Realms.bind 'filter:change', this.filter
      Realms.update()
      this.initSearch()

    # Add a single realm to the page.
    addOne: (realm) ->
      view = new RealmView(model: realm)
      this.el.append view.render().el

    # Add an entire list of realms to the page.
    # Deletages to this.addOne.
    addAll: ->
      view = this
      _.each Realms.models, (realm) ->
        unless realm.view?
          view.addOne realm
      # Now that the initial data is shown, start the controller's routing.
      Backbone.history.start()

    # Called when the "keyup" event is fired from the input box.
    # Sets the hash tag, which the controller picks up on and fires
    # events to ask the app to filter based on the input.
    search: ->
      window.location.hash = this.$("input").val()

    # Set the initial value of the search box to be whatever is in the URL.
    initSearch: ->
      this.$("input").val(window.location.hash.substring(1))
      this.$("input").focus()

    # Called when the realm list's filter:change event is triggered.
    # Iterates over the realms to see if each matches the search value.
    filter: (term) ->
      this.$("input").val(term)
      if term == ""
        this.$("#reset").hide()
      else
        this.$("#reset").show()
      Realms.each (realm) ->
        if realm.get('name').startsWith(term)
          realm.view.show()
        else
          realm.view.hide()

    startLoading: ->
      this.$("#loading img").show()

    stopLoading: ->
      this.$("#loading img").hide()

    updateTime: ->
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

  window.Router = new Controller
  window.Realms = new RealmList
  window.App    = new AppView
