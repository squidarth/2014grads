PER_PAGE = 10;

Router.map(function() {
  this.route('home', {path: "/"});
});

Profiles = new Meteor.Collection("profiles");

function queryTerm(re) {
  return {
    $or: [
    {'profile.name' : re},
    {'profile.place' : re},
    {'profile.destination' : re},
    {'profile.doing' : re},
    {'profile.starting' : re}
      ]
  }
}

if (Meteor.isClient) {
  Meteor.subscribe("users");

  Meteor.startup(function() {
    Session.set("current_page", 1);
  });

  Template.login_modal.events({
    'submit .login-form' : function(e) {
      e.preventDefault();

      var $form = $(e.currentTarget);

      Meteor.loginWithPassword(
        $form.find("#email").val(),
        $form.find("#password").val(), function() {
          $(".login-modal").modal('hide');
          $(".edit-info-modal").modal('show');
        });

      return false;
    }
  });

  Template.page_nav.events({
    'click .nav-next' : function() {
      Session.set("current_page", parseInt(Session.get("current_page")) + 1);
      if (Session.get("search_name") ) { 
        Meteor.subscribe("users_offset", parseInt((Session.get("current_page")) - 1) * PER_PAGE, Session.get("search_name"));
      } else {
        Meteor.subscribe("users_offset", parseInt((Session.get("current_page")) - 1) * PER_PAGE, null);

      }
    },

    'click .nav-prev' : function() {
      Session.set("current_page", Session.get("current_page") - 1);
    }
  });

  Template.page_nav.showPrev = function() {
    return Session.get("current_page") != 1
  };

  Template.page_nav.showNext = function() {
    var options = {limit: PER_PAGE};
    options.skip = (Session.get("current_page") - 1) * PER_PAGE;

    if (Session.get("search_name")) {
      var re = new RegExp(Session.get("search_name"), "i");
      return Meteor.users.find(queryTerm(re), options).count() == PER_PAGE;
    } else {
      return Meteor.users.find({}, options).count() == PER_PAGE
    }
  };

  Template.hello.user = function() {
    return Meteor.user();
  };
  Template.edit_info_modal.user = function() {
    return Meteor.user();
  };

  Template.hello.greeting = function () {
    return "Welcome to postgrad.";
  };

  Template.profiles.users = function() {
    var options = {limit: PER_PAGE};
    if (Session.get("current_page")) {
      options.skip = (Session.get("current_page") - 1) * PER_PAGE;
    }
    if (Session.get("search_name")) {
      var re = new RegExp(Session.get("search_name"), "i");
      return Meteor.users.find(queryTerm(re), options);
    } else {
      return Meteor.users.find({}, options);
    }
  };

  Template.hello.events({
    'click input': function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    },

    'keyup .search': function(e) {
      Session.set("current_page", 1);
      Session.set("search_name", $(".search").val());
      Meteor.subscribe("users_offset", 0, Session.get("search_name"));
    },

    "submit .info-edit-form" : function(e) {
      e.preventDefault();

      var $form = $(e.currentTarget);

      Meteor.users.update({
        _id: Meteor.user()._id
      }, {$set: {
        "profile.name" : $form.find("#name").val(),
        "profile.destination" : $form.find("#destination").val(),
        "profile.doing" : $form.find("#doing").val(),
        "profile.summer_plans" : $form.find("#summer_plans").val(),
        "profile.place" : $form.find("#place").val(),
        "profile.starting" : $form.find("#starting").val(),
        "profile.comments" : $form.find("#comments").val()
      }});

      $(".edit-info-modal").modal("hide");
      return false;
    },
    "submit .info-add-form" : function(e) {
      e.preventDefault();
      var $form = $(e.currentTarget);

      Accounts.createUser({
        email: $form.find("#emailInput").val(),
        password: $form.find("#password").val(),
        profile: {
          email: $form.find("#emailInput").val(),
          destination: $form.find("#destination").val(),
          doing: $form.find("#doing").val(),
          name:  $form.find("#name").val(),
          summer_plans: $form.find("#summer_plans").val(),
          comments: $form.find("#comments").val(),
          starting: $form.find("#starting").val(),
          place: $form.find("#place").val()
        }
      }, function(e) {
        $(".add-info-modal").modal("hide");
      });

      return false;
    }
  });
}

if (Meteor.isServer) {
  Meteor.publish("users", function() {
    return Meteor.users.find({}, {limit: PER_PAGE});
  });

  Meteor.publish("users_offset", function(offset, name) {
    var re = new RegExp(name, "i");
    if (name) {
      return Meteor.users.find(queryTerm(re), {limit: PER_PAGE * 2, skip: offset});
    } else {
      return Meteor.users.find({}, {limit: PER_PAGE * 2, skip: offset});
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
