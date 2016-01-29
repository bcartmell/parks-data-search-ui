(function() {
  'use strict';
  var searchParksUrl = 'http://localhost:9200/national_parks/_search';
  var trackedProps = [
    {dataName: 'UNIT_NAME', humanName: 'Park Name'},
    {dataName: 'GIS_NOTES', humanName: 'GIS Notes'},
    {dataName: 'UNIT_CODE', humanName: 'Unit Code'},
    {dataName: 'UNIT_TYPE', humanName: 'Unit Type'}
  ];

  $(function() {
    $('form#search-parks').submit(function(event) {
      event.preventDefault();
      $('table').remove();
      var formData = $(this).serializeArray().filter(hasValue); 
      submitQuery(buildQuery(formData), function(data) {
        displayResults(JSON.parse(data.responseText));
        console.log(data);
      });
    });
  });

  function submitQuery(query, callback) {
    $.ajax({
      url: searchParksUrl,
      type: 'POST',
      data: JSON.stringify(query),
      dataType: 'json',
      complete: function(data) {
        callback(data);
      }
    });
  }

  function matchWords(queryVal) {
    return queryVal;
  }

  function matchPhrase(queryVal) {
    return {
      query: queryVal,
      type: 'phrase'
    }
  }

  function buildQuery(formData) {
    var query = { 
      query: {
        bool: {
          should: {
            match:{} 
          }
        }
      },
      highlight: { 
        fields: {} 
      } 
    };

    var quoted;
    for (var i=formData.length; i--;) {
      query.query.bool.should.match[formData[i].name] = { 
        query: formData[i].value.replace(/'|"/g, '')
      };
      if (formData[i].value.match(/('.+')|(".+")/)) {
        query.query.bool.should.match[formData[i].name].type = 'phrase';
      }
      query.highlight.fields[formData[i].name] = {};
    }
    return query;
  }

  function hasValue(field) {
    return field.value && field.value !== '';
  }

  function makeRow(record) {
    var row = document.createElement('tr');
    var props = record._source.properties;
    var i, max=trackedProps.length;
    for (var i=0; i<max; i++) {
      var cell = document.createElement('td');
      if (record.highlight && record.highlight['properties.'+trackedProps[i].dataName]) {
        cell.innerHTML = record.highlight['properties.'+trackedProps[i].dataName];
      } else {
        cell.textContent = props[trackedProps[i].dataName];
      }
      row.appendChild(cell);
    }
    return row;
  }

  function displayResults(results) {
    var resultsTable = document.createElement('table');
    var resultsHead = document.createElement('thead');
    var resultsHeadRow = document.createElement('tr');
    var resultsTableBody = document.createElement('tbody');

    (function() {
      var cell, i, max=trackedProps.length;
      for (var i=0; i<max; i++) {
        cell = document.createElement('th');
        cell.textContent = trackedProps[i].humanName;
        resultsHeadRow.appendChild(cell);
      }
    }());

    resultsHead.appendChild(resultsHeadRow);
    resultsTable.appendChild(resultsHead);

    (function() {
      var resultHits = results.hits.hits;
      var i, max=resultHits.length;
      for (i=0; i<max; i++) {
        resultsTableBody.appendChild(makeRow(resultHits[i]));
      }
    }());

    resultsTable.appendChild(resultsTableBody);
    document.body.appendChild(resultsTable);
  }

}());
