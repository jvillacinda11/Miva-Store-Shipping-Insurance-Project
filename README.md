 # Overview

At page load the template will check if there is an existing "Shipping Insurance" fee and if the basket subtotal is the within allowable range.

If the basket subtotal is within the allowable range then the toggleable switch will appear in the basket and mini-basket. It will either be in the on or off position depending on there is an existing "Shipping Insurance" cost.

The customer can click on the switch. On click the toggle bar will trigger an AJAX GET request to a page that serves as an api. It will pass on variables containing information on the customer's basket through url parameters or the request body.

The "api" page will apply the charge, remove the charge or update the charge. In each case, a status code and message are returned and the Basket / mini-basket will update accordingly. The cases can be found here

## Request Body
The request will be  passed through url parameters.

```https://yourdomain.com/shipping_insurance_api/?ship_insurance_cost={Float}&current_charge={Float}&rqst_mode={String}&ajax=1```

## Variables and Possible Values

```javascript
ship_insurance_cost = {float} // Calculated using Subtotal and UPS rates.

current_charge = {float} // if charge is active this is the current charge

rqst_mode = {string} // add, delete, update
```

The "api" page will attempt to either add the charge, remove the charge, update the charge or throw an error. The following are the cases that can be encountered.

## Cases
### SUCCESSFUL CASES
1. rqst_mode equals ```'add'```. All Validation checks pass. This returns:
```json
    {
    "status_code": "S1",
    "message" : "Charge Added Successfully"
    }
```
2. rqst_mode equals ```'delete'```. All validation checks pass. This returns:
```json
    {
        "status_code" : "S2",
        "message" : "Charge Removed Successfully"
    }
```
3. rqst_mode equals ```'update'``` and all validation checks pass. This returns:
```json
    {
        "status_code" : "S3",
        "message": "Charged Updated Successfully"
    }
```

### UNSUCCESSFUL CASES 
Each parameter validation failure returns its own error status code and message and is returned as an array.

1. Charge is less than 0. This returns:
```json
[
    {
        "status_code" : "E0",
        "message" : "Charge Must Be Greater Than 0"
    }
]
```
1. charge is larger than allowable amount. This returns:
```json
[
    {
        "status_code" : "E1",
        "message" : "Subtotal too large. Contact Sales for insurance options"
    }
]
```
1. Current shipping charge is less than zero. This returns:
```json
[
    {
        "status_code" : "E2",
        "message" : "Current charge is less than 0. Charge Deleted."
    }
]
```
1. rqst_mode does not equal any of the allowable values. This returns:
```json
[
    {
        "status_code" : "E3",
        "message" : "Invalid Request Type"
    }
]
```
1. One or more request parameters is missing. This returns:
```json
[
    {
        "status_code" : "E4",
        "message" : "Missing one or more request parameters"
    }
]
```

### Edge Cases
1. Customer initially has a basket that includes shipping insurance. They remove enough item so that the basket total is less than $100. Shipping insurance is only required for baskets that have a subtotal of more than $100. When this happens the charge will be equal to 0 so it would ship_insurance_cost will not pass. The customer must be able to remove the charge so we must add an exception.

if ship_insurance_cost = 0 AND current_charge > 0 AND rqst_mode = 'add' or 'update' then ship_cost_isvalid = 1.

This way it passes the final check.


## IMPORTANT NOTE: 
Shipping insurance is NOT meant for Local Pick up Shipping Method. I am adding this feature to the basket and mini-basket for the case of customers choosing the Paypal checkout.
Paypal checkout is a one-page checkout where customers can input their address, billing info and choose shipping method. Paypal can't pull the option for Shipping Insurance. So there is
a possibility that a customer can choose to insure their package before clicking Paypal checkout and then choose Local Pickup on the Paypal one-page checkout. If this happens sales 
must be contacted for a partial refund.

## OTHER CONSIDERATIONS
 How will the shipping insurance update in the case of a customer adding or removing an item to their basket when they have already added shipping insurance to their cart.

## UPDATING OLD CODE
1. I will remove the code in the Global Head Tag that deletes the shipping insurance
