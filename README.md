jquery-slideview-mc
===================

JQuery Slider Component

Features
--------
* touch, mousewheel and keyboard interaction
* dynamically loads content slides via ajax
* setup slide urls from navigation links
* endless scrolling

Example
-------

```
$(document).ready(function() {
  $("#slideview").slideview();
});
```

Get access to the plugin-instance:
```
var slideview = $("#slideview").data('slideview');
```


Options
-------
<table>
  <tr>
    <th>Name</th><th>Description</th><th>Default</th>
  </tr>
  <tr>
    <td>containerClass</td><td>Container css class</td><td>checkview</td>
  </tr>
  <tr>
    <td>iconClass</td><td>Icon css class</td><td>icon-ok</td>
  </tr>
  <tr>
    <td>autoSubmit</td><td>Specifies whether to submit form on element change</td><td>false</td>
  </tr>
</table>

Methods
-------
<table>
  <tr>
    <th>Name</th><th>Description</th><th>Return</th>
  </tr>
  <tr>
    <td>invalidate</td><td>Refreshes the component</td><td>void</td>
  </tr>
  <tr>
    <td>setChecked(bool)</td><td>Set the checked state of the component</td><td>void</td>
  </tr>
  <tr>
    <td>getChecked</td><td>Returns the checked state of the component</td><td>boolean</td>
  </tr>
</table>