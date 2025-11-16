# vscode-jsx-style-to-css

extension that allows to improve DX around refactoring code from using inlined styles to using css-module classes

## Usage

1. select a component
2. open command panel and use action style-to-css-module
3. extension will do the following:
  1. will create a css-module of the same name as file + .module.css if it does not exist yet
  2. gives you the option to give the class a name (pressing enter will create randomized name)
  3. will move the inlined styles to a class with the specified name
  4. will import the .module.css and add the class to the component
