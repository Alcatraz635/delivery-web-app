
$(document).ready(function() {
	//Allows users to change delivery address for a new order
    $("#deliveryAddressButton").click(function() {
        $("#deliveryAddress").removeAttr("readonly");
    });
    //Stops order form from being submitted unless atleast one order is checked
    $("#order_table").submit(function(e) {
  if($("input:checkbox:checked").length < 1) {
    alert("No orders selected");
    e.preventDefault();
  }
});
});
//Removes success or error messages after three seconds
window.setTimeout(function() {

    $(".alert").slideUp(500, function() {
        $(this).remove();
    });
}, 3000);