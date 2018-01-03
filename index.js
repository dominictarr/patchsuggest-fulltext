var pull = require('pull-stream')

exports.gives = {
  suggest: {
    compose: true, search: true
  }
}

exports.needs = {
  sbot: { search: { query: 'first' } } //need a better way to add new plugins though...
}

var highlight = require('highlight-search-result')

exports.create = function (api) {

  function hasSigil (word) {
    if(word[0] == '?' && word.length > 3 &&
      word.split(/[^\w]+/).filter(function (e) {
        return e.length > 3
      }).length
    ) return true
  }

  function nonEmpty (word) {
    return (word || '').trim().length > 0
  }

  function lookup (word, limit, cb) {
    pull(
      api.sbot.search.query({query: word, limit: limit}),
      pull.collect(cb)
    )
  }

  function create(limit, map) {
    return function (word, cb) {
      lookup(word, limit, function (err, ary) {
        cb(err, ary.map(map).filter(Boolean))
      })
    }
  }

  return {
    suggest: {
      compose: function (word) {
        if(hasSigil(word))
          return create(10, function (data) {
            var text = data.value.content.text
            if(!text) return
            return {
              title: highlight(text, word, 250),
              value: '['+word+']('+data.key+')'
            }
          })
      },

      search: function (word) {
        if(nonEmpty(word))
          return create(10, function (data) {
            var text = data.value.content.text
            if(!text) return
            return {
              title: highlight(text, word, 250),
              value: data.key
            }
          })
      }
    }
  }
}

