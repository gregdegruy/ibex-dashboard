import Fluxxor from 'fluxxor';
import moment from 'moment';
import React, { PropTypes, Component } from 'react';
import {Actions as Actions} from '../actions/Actions';
import env_properties from '../../config.json';
import bs from 'binarysearch';

export const DataStore = Fluxxor.createStore({
    initialize(profile) {
      
      this.dataStore = {
          userProfile: profile,
          timespanType: 'customMonth',
          datetimeSelection: 'March 2016',//moment().format(Actions.constants.TIMESPAN_TYPES.days.format),
          categoryType: '',
          activities: [],
          action: '',
          popularTerms: [],
          trends: [],
          timeSeriesGraphData: {},
          sentimentChartData: [],
          timeseriesFromDate: false,
          timeseriesToDate: false,
          sentimentTreeViewData: [],
          categoryValue: '',
          defaultResults: []
      }
      
      this.bindActions(
            Actions.constants.ACTIVITY.LOAD_EVENTS, this.handleLoadActivites,
            Actions.constants.DASHBOARD.LOAD, this.handleLoadDefaultSearchResults,
            Actions.constants.DASHBOARD.CHANGE_SEARCH, this.handleChangeSearchTerm,
            Actions.constants.GRAPHING.LOAD_GRAPH_DATA, this.handleLoadGraphData,
            Actions.constants.ACTIVITY.LOAD_SENTIMENT_TREE, this.handleLoadSentimentTreeView,
            Actions.constants.DASHBOARD.CHANGE_DATE, this.handleChangeDate
      );
    },

    getState() {
        return this.dataStore;
    },
    
    handleLoadActivites(activities){
        this.dataStore.activities = activities.response;
        this.emit("change");
    },
    
    handleLoadGraphData(timeSeries){
        this.refreshGraphData(timeSeries.response);
        this.emit("change");
    },
    
    indexTimeSeriesResponse(){
        let self = this;
        this.dataStore.timeSeriesGraphData['aggregatedCounts'] = [];
        let termSummaryMap = new Map();
        let maxMentionCount = 0;
        
        if(this.dataStore.timeSeriesGraphData && this.dataStore.timeSeriesGraphData.graphData){
            //hash the time series data by the epoch time as we'll use this to render 
            //the aggregates in the bar chart based on the selected graph zoom area. 
            this.dataStore.timeSeriesGraphData.graphData.map(timeEntry => {
                //Aggregate the normalized positive and negative sentiment breakdown as we need the total count for the Histogram.
                let graphEntry = self.aggregateSentimentLevelCounts(timeEntry, termSummaryMap);
                self.dataStore.timeSeriesGraphData.aggregatedCounts.push(graphEntry);
            });

            for (let [term, mentions] of termSummaryMap.entries()) {
                if(mentions > maxMentionCount){
                    maxMentionCount = mentions;
                    this.dataStore.timeSeriesGraphData['mostPopularTerm'] = term;
                }
            }

            self.dataStore.timeSeriesGraphData.termSummaryMap = termSummaryMap;
        }
    },

    //Based on aggregating off the follwoing sample dataset i.e. [1459605600000, 0, 0, 112, 65, 123, 94, 30, 10, 36, 25, 16, 16], [1459616400000, 0, 0, 142, 75, 83, 41, 44, 10, 60, 48, 13, 10]
    aggregateSentimentLevelCounts(graphDatetimeEntry, termSummaryMap){
        let i = 2, labelIndex = 1;
        let labels = this.dataStore.timeSeriesGraphData.labels;
        let graphEntry = {"date": new Date(graphDatetimeEntry[0])};

        if(graphDatetimeEntry && graphDatetimeEntry.length > 0){
            while(i < graphDatetimeEntry.length - 1){
                let label = labels[labelIndex++];
                graphEntry[label] = graphDatetimeEntry[++i] + graphDatetimeEntry[++i];
                let totalTermMentions = termSummaryMap.get(label);
                termSummaryMap.set(label, (totalTermMentions || 0) + graphEntry[label]);
            }
        }

        return graphEntry;
    },
    
    handleLoadDefaultSearchResults(searchResults){
        this.dataStore.defaultResults = searchResults.response;
        this.emit("change");
    },

    defaultSearchTermToMostMentioned(mostPopularTerm){
        let termSplit = mostPopularTerm.split('-');
        if(termSplit != null && termSplit.length == 2){
                this.dataStore.categoryValue = termSplit[1];
                this.dataStore.categoryType = Actions.constants.CATEGORY_KEY_MAPPING[termSplit[0]];
        }
    },
    
    refreshGraphData(timeSeriesData){
        this.dataStore.timeSeriesGraphData = {
            'labels': timeSeriesData.labels,
            'graphData': timeSeriesData.graphData.sort((a, b) => a[0]>b[0] ? 1 : a[0]<b[0] ? -1 : 0 )
        };

        this.indexTimeSeriesResponse();

        if(this.dataStore.categoryValue == "" && this.dataStore.timeSeriesGraphData.aggregatedCounts && this.dataStore.timeSeriesGraphData.aggregatedCounts.length > 0){
           this.defaultSearchTermToMostMentioned(this.dataStore.timeSeriesGraphData.mostPopularTerm);
        }

        this.dataStore.action = 'loadedGraphData';
    },
    
    handleChangeDate(changedData){
        this.dataStore.datetimeSelection = changedData.datetimeSelection;
        this.dataStore.timespanType = changedData.timespanType;
        this.refreshGraphData(changedData.timeSeriesResponse);
        this.dataStore.action = 'changedSearchTerms';
        
        this.emit("change");
    },
    
    handleChangeSearchTerm(changedData){
        this.dataStore.categoryValue = changedData.newFilter;
        this.dataStore.categoryType = changedData.searchType;
        this.dataStore.action = 'changedSearchTerms';
        
        this.emit("change");
    },
    
    handleLoadSentimentTreeView(treeView){
        this.dataStore.sentimentTreeViewData = this.recurseTree(treeView.folderTree);
        this.dataStore.treeData = this.dataStore.sentimentTreeViewData;

        this.emit("change");
    },

    recurseTree(dataTree){
      let rootItem = {
          name: 'Associations',
          toggled: true,
          children: []
      };

      let self = this;
      let recurseChildren = (parentDataFolder, parentListItem, levels) => {
          if(!parentDataFolder){
              return;
          }
          
          for (let [folderKey, subFolder] of parentDataFolder.entries()) {            
              let newEntry = {
                  name: subFolder.folderName,
                  folderKey: folderKey,
                  checked: false,
                  parent: parentListItem,
                  eventCount: Math.floor((Math.random() * 50) + 1)
              };
              
              parentListItem.children.push(newEntry);
              
              if(subFolder.subFolders.size > 0){
                  newEntry.children = [];
                  newEntry.eventCount = 0;
                  recurseChildren(subFolder.subFolders, newEntry, levels + 1);
              }
          }
      };
      
      recurseChildren(dataTree, rootItem, 1);
      
      return rootItem;
  },
});