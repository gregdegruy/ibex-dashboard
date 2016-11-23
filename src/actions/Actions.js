import {SERVICES} from '../services/services';

const ENGLISH_LANGUAGE = "en";

function GetSearchEdges(siteKey, languageCode, callback){
    SERVICES.getDefaultSuggestionList(siteKey, languageCode, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                 callback(body.data.search.edges);
            }else{
                 throw new Error(`[${error}] occured while processing entity list request`);
            }
     });
}

const constants = {
           SENTIMENT_JSON_MAPPING : {
                "0": -5,
                "-1": -15,
                "1": 5
           },
           TIMESPAN_TYPES : {
                'hours': {
                    format: "MM/DD/YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour"
                },
                'days': {
                    format: "MM/DD/YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day"
                },
                'months': {
                    format: "YYYY-MM", blobFormat: "[month]-YYYY-MM", rangeFormat: "month"
                },
                'weeks': {
                    format: "YYYY-WW", blobFormat: "[week]-YYYY-WW", rangeFormat: "isoweek"
                },
                'customDate': {
                    format: "MM/DD/YYYY", reactWidgetFormat: "MMM Do YYYY", blobFormat: "[day]-YYYY-MM-DD", rangeFormat: "day"
                },
                'customDateTime': {
                    format: "MM/DD/YY HH:00", reactWidgetFormat: "MMM Do YYYY HH:00", blobFormat: "[hour]-YYYY-MM-DDHH:00", rangeFormat: "hour"
                },
                'customMonth': {
                    format: "MMMM YYYY", reactWidgetFormat: "MMMM YYYY", blobFormat: "[month]-YYYY-MM", rangeFormat: "month"
                }
           },
           MOMENT_FORMATS: {
               "timeScaleDate": "MM/DD/YY HH:00"
           },
           SENTIMENT_COLOR_MAPPING : {
               "negative": "red",
               "neutral": "yellow",
               "positive": "green"
           },
           EVENT_SOURCE_ICON_MAP : {
               "twitter": "fa fa-twitter",
               "facebook": "fa fa-facebook-official"
           },
           CATEGORY_KEY_MAPPING: {
             'kw': 'keyword',
             'g': 'group',
             'sec': 'sector',
             'st': 'status'
           },
           DASHBOARD : {
               LOAD: "LOAD:DASHBOARD",
               CHANGE_SEARCH: "SEARCH:CHANGE",
               CHANGE_DATE: "DATE:CHANGE",
               ASSOCIATED_TERMS: "UPDATE:ASSOCIATED_TERMS",
               CHANGE_TERM_FILTERS: "UPDATE:CHANGE_TERM_FILTERS"
           },
           FACTS : {
               LOAD_FACTS: "LOAD:FACTS",
               LOAD_FACTS_SUCCESS: "LOAD:FACTS_SUCCESS",
               LOAD_FACTS_FAIL: "LOAD:FACTS_FAIL",
               SAVE_PAGE_STATE: "SAVE:PAGE_STATE",
               LOAD_FACT: "LOAD:FACT"
           },
           ADMIN : {
               LOAD_KEYWORDS: "LOAD:KEYWORDS",
               LOAD_FB_PAGES: "LOAD:FB_PAGES",
               LOAD_LOCALITIES: "LOAD:LOCALITIES",
               GET_LANGUAGE: "GET:LANGUAGE",
               GET_TARGET_REGION: "GET:TARGET_REGION",
               LOAD_FAIL: "LOAD:FAIL",
           },
};

const methods = {
    DASHBOARD: {
        initialize(siteKey){
          let self = this;
          let azureStorageCB = results => {
                if(results && results.length > 0){
                    self.dispatch(constants.DASHBOARD.LOAD, {
                                            response: results,
                                            siteKey: siteKey
                    });
                }
          };

          GetSearchEdges(siteKey, ENGLISH_LANGUAGE, azureStorageCB);
        },
        changeSearchFilter(selectedEntity, siteKey){
           let self = this;

           self.dispatch(constants.DASHBOARD.CHANGE_SEARCH, {selectedEntity});
        },
        changeTermsFilter(newFilters){
           this.dispatch(constants.DASHBOARD.CHANGE_TERM_FILTERS, newFilters);
        },
        updateAssociatedTerms(associatedKeywords, bbox){
            this.dispatch(constants.DASHBOARD.ASSOCIATED_TERMS, {associatedKeywords, bbox});
        },
        changeDate(siteKey, datetimeSelection, timespanType){
           this.dispatch(constants.DASHBOARD.CHANGE_DATE, {datetimeSelection: datetimeSelection, timespanType: timespanType});
        }
    },
    FACTS: {
        load_facts: function (pageSize, skip) {
            let self = this;
            let dataStore = this.flux.stores.FactsStore.dataStore;
            if (!dataStore.loading) {
                this.dispatch(constants.FACTS.LOAD_FACTS);
                SERVICES.getFacts(pageSize, skip)
                    .subscribe(response => {
                        self.dispatch(constants.FACTS.LOAD_FACTS_SUCCESS, { response: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.FACTS.LOAD_FACTS_FAIL, { error: error });
                    });
            }
        },
        save_page_state: function(pageState) {
            this.dispatch(constants.FACTS.SAVE_PAGE_STATE, pageState);
        },
        load_fact: function (id) {
            let self = this;
            let dataStore = this.flux.stores.FactsStore.dataStore;

            dataStore.factDetail = null;

            if (!dataStore.factDetail) {
                SERVICES.getFact(id)
                    .subscribe(response => {
                        self.dispatch(constants.FACTS.LOAD_FACT, { response: response });
                    }, error => {
                        console.warning('Error, could not load fact id: ' + id, error);
                    });
            }
        }
    },
    ADMIN: {
        load_keywords: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminKeywords()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.LOAD_KEYWORDS, { keywords: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error: error });
                    });
            }
        },

        load_localities: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminLocalities()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.LOAD_LOCALITIES, { localities: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error: error });
                    });
            }
        },

        load_fb_pages: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminFbPages()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.LOAD_FB_PAGES, { fbPages: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error: error });
                    });
            }
        },

         get_language: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminLanguage()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.GET_LANGUAGE, { language: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.FACTS.LOAD_FAIL, { error: error });
                    });
            }
        },

        get_target_region: function () {
            let self = this;
            let dataStore = this.flux.stores.AdminStore.dataStore;
            if (!dataStore.loading) {
                SERVICES.getAdminTargetRegion()
                    .subscribe(response => {
                        self.dispatch(constants.ADMIN.GET_TARGET_REGION, { targetRegion: response });
                    }, error => {
                        console.warning('Error, could not load facts', error);
                        self.dispatch(constants.ADMIN.LOAD_FAIL, { error: error });
                    });
            }
        }
    }
};

export const Actions = {
  constants: constants,
  methods: methods
};
