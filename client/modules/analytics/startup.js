import { AnalyticsEvents, Packages } from "/lib/collections";

Meteor.startup(function () {
  Tracker.autorun(function () {
    var coreAnalytics, googleAnalytics, mixpanel, segmentio;
    coreAnalytics = Packages.findOne({
      name: "reaction-analytics"
    });
    if (!coreAnalytics || !coreAnalytics.enabled) {
      Alerts.removeType("analytics-not-configured");
      return;
    }
    googleAnalytics = coreAnalytics.settings["public"].googleAnalytics;
    mixpanel = coreAnalytics.settings["public"].mixpanel;
    segmentio = coreAnalytics.settings["public"].segmentio;
    if (segmentio.enabled) {
      if (segmentio.api_key) {
        analytics.load(coreAnalytics.settings["public"].segmentio.api_key);
        return;
      } else if (!segmentio.api_key && Roles.userIsInRole(Meteor.user(), "admin")) {
        _.defer(function () {
          return Alerts.toast(
            `Segment Write Key is not configured. <a href="/dashboard/settings/reaction-analytics">Configure now</a> or <a href="/dashboard">disable the Analytics package</a>.`,
            "danger", {
              html: true,
              sticky: true
            });
        });
      }
    }
    if (googleAnalytics.enabled) {
      if (googleAnalytics.api_key) {
        ga("create", coreAnalytics.settings["public"].google - analytics.api_key, "auto");
      } else if (!googleAnalytics.api_key && Roles.userIsInRole(Meteor.user(), "admin")) {
        _.defer(function () {
          return Alerts.toast(
            `Google Analytics Property is not configured. <a href="/dashboard/settings/reaction-analytics">Configure now</a> or <a href="/dashboard">disable the Analytics package</a>.`,
            "errorr", {
              type: "analytics-not-configured",
              html: true,
              sticky: true
            });
        });
      }
    }
    if (mixpanel.enabled) {
      if (mixpanel.api_key) {
        mixpanel.init(coreAnalytics.settings["public"].mixpanel.api_key);
      } else if (!mixpanel.api_key && Roles.userIsInRole(Meteor.user(), "admin")) {
        _.defer(function () {
          return Alerts.toast(
            `Mixpanel token is not configured. <a href="/dashboard/settings/reaction-analytics">Configure now</a> or <a href="/dashboard">disable the Analytics package</a>.`,
            "error", {
              type: "analytics-not-configured",
              html: true,
              sticky: true
            });
        });
      }
    }
    if (!Roles.userIsInRole(Meteor.user(), "admin")) {
      return Alerts.removeType("analytics-not-configured");
    }
  });
  return $(document.body).click(function (e) {
    var $targets;
    $targets = $(e.target).closest("*[data-event-action]");
    $targets = $targets.parents("*[data-event-action]").add($targets);
    return $targets.each(function (index, element) {
      var $element, analyticsEvent;
      $element = $(element);
      analyticsEvent = {
        eventType: "event",
        category: $element.data("event-category"),
        action: $element.data("event-action"),
        label: $element.data("event-label"),
        value: $element.data("event-value")
      };
      if (typeof ga === "function") {
        ga("send", "event", analyticsEvent.category, analyticsEvent.action, analyticsEvent.label,
          analyticsEvent.value);
      }
      if (typeof mixpanel === "object" && mixpanel.length > 0) {
        mixpanel.track(analyticsEvent.action, {
          "Category": analyticsEvent.category,
          "Label": analyticsEvent.label,
          "Value": analyticsEvent.value
        });
      }
      if (typeof analytics === "object" && analytics.length > 0) {
        analytics.track(analyticsEvent.action, {
          "Category": analyticsEvent.category,
          "Label": analyticsEvent.label,
          "Value": analyticsEvent.value
        });
      }
      return AnalyticsEvents.insert(analyticsEvent);
    });
  });
});