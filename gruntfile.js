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
        files: {'docs/main.md': ['*.js']},
      }
    },
    watch: {
      main: {
        files: ['*.js'],
        tasks: ['jshint', 'jsjsdoc']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsjsdoc');

  grunt.registerTask('default', ['jshint', 'jsjsdoc', 'watch']);
  
};


