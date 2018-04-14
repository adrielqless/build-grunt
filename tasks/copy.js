var ignoredFiles = [
  '!_*',
  '!.*',
  '!dist',
  '!grunt',
  '!node_modules',
  '!*.{sh,js,json,md}'
]

var includeFiles = [
  'res/imgs/**/*',
  'res/js/lib/googleanalytics.js',
  'res/js/lib/raven.min.js',
  'META-INF/*',
  'WEB-INF/*'
]

var srcFiles = [
  'res/css/**/*.{scss,css,map}',
  'res/js/**/*.{js,map}'
]

module.exports = {
  dev: {
    files: [{
      expand: true,
      cwd: '',
      src: [].concat(includeFiles, srcFiles, ignoredFiles),
      dest: 'dist'
    }]
  },
  prod: {
    files: [{
      expand: true,
      cwd: '',
      src: [].concat(includeFiles, ignoredFiles),
      dest: 'dist'
    }]
  },
  extra: {
    files: [{
      expand: true,
      cwd: '',
      src: '<%= pkg.buildCopy %>',
      dest: 'dist'
    }]
  },
  war: {
    files: [
      {
        expand: true,
        cwd: './dist/',
        src: ['*.war'],
        dest: '/usr/local/jboss/server/default/deploy'
      }
    ]
  }
}