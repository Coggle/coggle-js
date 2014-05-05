module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    jsjsdoc: {
      main: {
        files: {'docs/main.md': ['*.js', 'test/*.js']},
      }
    },
    mochaTest: {
      options: {
        reporter: 'spec',
        clearRequireCache: true
      },
      test: {
        src: ['test/*.js']
      }
    },
    watch: {
      main: {
        options: {
          spawn: false
        },
        files: ['*.js', 'test/*.js'],
        tasks: ['default']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsjsdoc');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['jshint', 'jsjsdoc', 'watch']);
  grunt.registerTask('test', ['mochaTest']);
  
};


