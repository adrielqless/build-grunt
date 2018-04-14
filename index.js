#!/usr/bin/env node
var path = require('path')
var grunt = require('grunt')
var pkg = require('./package.json')

// Get the tasks passed in to the command
var TasksArgs = process.argv.slice(2).filter(function (task) {
  return /^[a-zA-Z:-_.]+$/.test(task)
})

// Get the options passed in to the command
var TasksOpts = {}
process.argv.slice(2).forEach(function (opt, index, opts) {
  if (opt.slice(0, 2) === '--') {
    var option = opt.slice(2).split('=')
    var key = option[0]
    var val = option.length > 1 ? option[1] : true

    // If a custom bump type is set, update the task list
    if (key === 'bumpType' && ['patch', 'minor', 'major'].indexOf(val) > -1) {
      var tskIdx = TasksArgs.indexOf('bump')
      if (tskIdx > -1) {
        TasksArgs.splice(tskIdx, 1, 'bump:' + val)
      }

      tskIdx = TasksArgs.indexOf('publish')
      if (tskIdx > -1) {
        TasksArgs.splice(tskIdx, 1, 'bump:' + val, 'buildprod')
      }

      // Dedupe the task list, removing all but the first instances
      TasksArgs.forEach(function(task, idx, arr) {
        if (arr.indexOf(task) !== idx) {
          arr.splice(idx, 1)
        }
      })

      return
    }

    TasksOpts[key] = val
  }
})

// Create a reference for here
var BuildDir = path.resolve(__dirname)

// Store the cwd
var cwd = process.cwd()

// Load all the required grunt task plugins. Requires first changing to here
// and then changing back after the tasks are run. Since grunt doesn't report
// when it can't load something, "spy" on its error
var err = grunt.log.error
var missing = []
grunt.log.error = function (msg) {
  var match = /Local Npm module "([a-zA-Z0-9-_@/]+)" not found/.exec(msg)
  if (match) {
    missing.push(match[1])
  } else {
    err(msg)
  }
}
grunt.loadNpmTasks(pkg.name)
process.chdir(BuildDir)
missing.forEach(grunt.loadNpmTasks)
process.chdir(cwd)
grunt.log.error = err

// Helper to load configs
var reqTask = function (task) {
  return require(path.resolve(BuildDir, 'tasks', task))
}

var projPkg = grunt.file.readJSON('package.json')
grunt.initConfig({
  pkg: projPkg,
  bump: reqTask('bump'),
  clean: reqTask('clean'),
  copy: reqTask('copy'),
  htmlmin: reqTask('htmlmin'),
  includereplace: reqTask('includereplace'),
  postcss: reqTask('postcss'),
  sass: reqTask('sass'),
  uglify: reqTask('uglify'),
  war: reqTask('war'),
  watch: reqTask('watch')
})

// SPECIFY TASKS TO RUN

// Atomic tasks to process the HTML, CSS, and Javascript
grunt.registerTask('css', ['sass', 'postcss'])
grunt.registerTask('assets', reqTask('assets')(grunt))
grunt.registerTask('html', ['includereplace', 'htmlmin'])

// Tasks to compile the project
// noop task to run if there are no extra files to copy
grunt.registerTask('noop', function () {})
grunt.registerTask('compile', ['clean', 'html', 'css', 'assets'])
grunt.registerTask('build', [
  'compile',
  'copy:dev',
  Array.isArray(projPkg.buildCopy) ? 'copy:extra' : 'noop',
  'war:dev'
])
grunt.registerTask('buildprod', [
  'compile',
  'copy:prod',
  Array.isArray(projPkg.buildCopy) ? 'copy:extra' : 'noop',
  'war:prod'
])

// Tasks to Deploy the project
grunt.registerTask('publish', ['bump', 'buildprod'])
grunt.registerTask('deploy', ['build', 'copy:war'])

// Development task to create a watch
grunt.registerTask('dowatch', ['compile', 'watch'])

// Default task(s).
grunt.registerTask('default', ['build'])

// Finally run the tasks, with options and a callback when we're done
grunt.file.setBase(cwd)
grunt.tasks(TasksArgs, Object.assign({
  gruntfile: false
}, TasksOpts), function () {
  grunt.log.ok('All build tasks done.')
})