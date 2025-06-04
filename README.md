# MIVA Store Shipping Insurance Project

## Table of Contents
- [Overview](#overview)
- [High-Level Overview](#high-level-overview)
- [Components Explained](#components-explained)
    - [UPS_DECLARED_VALUE_MACHINE.mv](#ups_declared_value_machinemv)
    - [toggle_component.htm](#toggle_componenthtm)
    - [ups-dv-toggle-handler.js](#ups-dv-toggle-handlerjs)
    - [API_Page.htm](#api_pagehtm)
    - [PREACTION_OPAY.mv](#preaction_opaymv)
- [Template Code Changes](#template-code-changes)
    - [Global Header](#global-header)
    - [BASK](#bask)
    - [ORDL](#ordl)
    - [Global Mini-Basket Template](#global-mini-basket-template)
    - [OSEL](#osel)
- [Shortcomings](#shortcomings)


**NOTE:** This repo is intended to serve as a reference for a client's existing store. You can use this project on your own for your store, though it might not meet all your specific needs.  A developer would be required for the installation. If you want me to install this feature on your store or have any inquiries, please reach out to me at jvillacoding@gmail.com. Thank you!

## Overview
 Before, we offered shipping insurance at OSEL towards the end of the standard MIVA checkout. With the introduction of the PayPal buttons, a customer can check out at an earlier point, and there is no way to add shipping insurance in the PayPal pop-up modal. So we need to provide a way to add shipping protection at an earlier point in the shopping session.

 This project sets out to solve this problem by creating a UI that allows customer to easily add shipping protection to their order at multiple points in their shopping session and to dynamically update the shipping protection fee as they add or remove items from their order.

### High-Level Overview

1. `UPS_DECLARED_VALUE_MACHINE.mv` calculates the UPS Declared Value Fee and checks if the fee already exists in the customer's basket.
2. `toggle_component.html` uses this information to populate the toggle switches' data attributes. 
3. `ups-dv-toggle-handler.js` sends the AJAX GET request with all the toggle switch's data attributes when the customer clicks the toggle switch.
4. `API_Page.mv` processes the request parameters (toggle switch data attributes). If they are valid, then it either adds, updates, or deletes the UPS DV fee. If not, then it will send error information.
5. `Shipping_Insurance_front_end.js` will receive this data and will update the UI as needed.
6. If the customer makes changes to their basket, then `UPS_DECLARED_VALUE_MACHINE.mv` will see that there is a mismatch between the calculated fee and the fee in the basket. In this case, it will update the fee.
7. Our website asks one last time if they want to protect their order on OSEL. This choice is required for the order to be complete. When they submit the form to the next page, they will first be taken to a PREACTION page. This is where the charge will be added if they choose it. After the charge is applied, they are taken to OPAY to complete the purchase.

---

## Components Explained

### UPS_DECLARED_VALUE_MACHINE.mv

**Where should this be added on the website?**

This file should be added as a Theme Component Content Section, and the component is called in the global header and specifically in the BASK page in the AJAX section.  This is because an AJAX request to BASK is made when a customer adds a product to their cart. BASK only returns what is within a conditional code block. The conditional block does not call the global header so you must explicitly call the `UPS_DECLARE_VALUE_MACHINE` to access its variables.

**What does this file do?**
1. **Calculates UPS Declared Value Fee** 

    It calculates this based on the subtotal before any discounts. This way, the full value of the products can be covered. If the subtotal is at or below $100, then it is covered by the standard UPS liability of loss, so the fee is $0. If it is between $100.01 and $300, then it is a flat rate of $4.85. For anything greater than $300, the fee is calculated by rounding up the subtotal to its next 100. Once the fee is calculated, it is stored in `l.settings:ship_ins_cost`. 

    This changes yearly. To find up-to-date information, click [here](https://www.ups.com/assets/resources/webcontent/en_US/retail_rates.pdf)

2. **Tracks State of the Fee** 
    
    It uses BasketChargeList_Load_Type() on page load to check the customer's basket for a charge with the type of SHIPPING_INSURANCE. If it succeeds and the function finds it, then `l.settings:ship_ins_isactive` is set to 1 (state is active); if not, then it is set to 0 (state is not active). If it is found, then that charge structure (MIVA equivalent of a JavaScript object) is saved to `l.settings:UPS_DV_charge`

3. **Updates current charge**

    To check if there is a change in the basket, it checks to see if the UPS DV charge is active and if the calculated cost is equal to the current amount being charged. If they are the same, this means that no change has occurred, so no update is required. If they don't match, then it deletes the current charge and checks if the calculated fee is more than 0 and less than the allowable maximum. If it is more than zero, then it creates a new charge that equals the calculated fee. If the calculated charge equals zero, that means no new charge needs to be created, so it moves on to the next step. Finally, it will reload all charges so all the charge information is up to date on the UI.

**Variables**

```xml
l.settings:ship_ins_cost -------- calculated UPS Declared Value Fee

l.settings:ship_ins_isactive ----- holds the state of the fee

l.settings:UPS_DV_charge --------- holds SHIPPING_INSURANCE charge.

l.settings:UPS_DV_max_charge ------ this is calculated by taking the maximum allowable subtotal and multiplying by the UPS rate percentage. This gives the maximum allowable charge

```

---

### toggle_component.htm

**Where should this be added on the website?**

This file should be added as a Theme Component Content Section, and the component is called wherever you want the toggle to be placed. In our store, it is called in the minibasket, ORDL and BASK page. 

**What does this file do?**

1. **Initializes Data Attributes**

    It sets the toggle switch's data attributes. These include `data-rqst_mode` (request mode), `data-shipping_cost` (Calculated UPS DV cost), `data-current_charge` (current UPS DV fee in basket), `data-current_total` (current basket total). The data attributes used for the GET request are put into the structure: `l.settings:UPS_DV_reqst_param`.

    data-

    Note: `data-current_total` is the only data attribute that isn't sent during the GET request. It is used to update the UI. More on this in `ups-dv-toggle-handler.js`. 

2. **Contains the Toggle switch itself**

    This only holds the toggle switch, not the surrounding element, like in BASK. See the picture below. It has a class name divToggle. This is used to identify every instance of it on the page using `ups-dv-toggle-handler.js`. 

    ![](./assets/BASK_toggle_with_info.png)

**Associated CSS**

I used this CSS for the toggle switch. This is located in the `theme-styles` CSS resource.

```css
    /* ---------- Toggle Switch------------ */
    .toggle-wrapper {
      display: inline-block;
      position: relative;
      width: 35px;
      height: 15px;
      background-color: #ccc;
      border-radius: 34px;
      cursor: pointer;
      transition: background-color 0.4s;
    }

    .toggle-circle {
      position: absolute;
      height: 10px;
      width: 10px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.4s;
    }

    .toggle-wrapper.active {
      background-color: #408b34;
    }

    .toggle-wrapper.active .toggle-circle {
      transform: translateX(19px);
    }

    .toggle-wrapper.loading {
      background-color: #c0c0c0 !important;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .u-hidden-important{
      display: none!important;
    }

```

**MIVA Variables**


```xml
    l.settings:UPS_DV_rqst_param:rqst_mode ----------------- "request mode". This can have the values of add, delete, and update.

    l.settings:UPS_DV_rqst_param:ship_in_cost -------------- "Shipping Insurance Cost". This is the calculated amount to be charged for the customer's current basket.

    l.settings:UPS_DV_rqst_param:current_charge ------------ "Current Charge". This is the existing charge in the customer's basket.

    l.settings:UPS_DV_rqst_param:max_ship_ins_cost --------- "Maximum Allowable Shipping Insurance Cost". This is the maximum allowable shipping insurance cost.

```

---

### ups-dv-toggle-handler.js

This takes into account toggle switches that are loaded dynamically (after page load). This only happens when a customer does an Ajax add-to-cart, and it automatically opens the mini-basket. It delegates the event binding to the mini-basket itself. For toggle switches that are loaded statically (at page load), the event binding is on the toggle itself. 

**Where should this be added on the website?**

This file should be added as a JavaScript resource, set to global and active, and added to the footer_js resource group.

**What does this file do?**

1. **Sends GET request to update UPS DV charge in basket**

    It assigns the toggle switch's data attributes to request parameters and then sends them with a GET request to `API_Page.mv`, which has the URL `/shipping-insurance-api.html`. 

2. **Updates UI**

    Once it receives a response from the API, it updates the Line item in the main basket, the total in the main basket (BASK only), the total in the mini basket (global), and the toggle switch state (on/off). 

3. **Prevents Spam clicking**

    It puts the toggle switch into a loading state once clicked, making it unusable until the whole script is done (after the UI is updated).

---

### API_Page.htm

This page receives the toggle data attribute through URL parameters from the GET request. They are stored on this page in a global variable. They include:

```xml
g.ship_insurance_cost
g.current_charge
g.rqst_mode
g.max_ship_ins_cost
```

**Where should this be added on the website?**

This should be added as a page. The canonical URL should be `/shippings-insurance-api.html`. You can put a different URL, but you would have to change the URL in `ups-dv-toggle-handler.js`. The page code used was `shipping-insurance-api`, but it can be anything you want without changing anything else.

**What does this file do?**

1. **Validates request data**

    Before it attempts to make changes to the charge, this validates the parameters for the following
    
    - Shipping Insurance cost must be within the allowable range. (0 < shipping insurance cost <= maximum allowable shipping insurance cost)
    - Current charge must be greater than zero.
    - Request mode must be one of the allowable values: "add", "delete", or "update"
    - AJAX value must be set to 1.
    - All parameters must be sent. These include: request mode, shipping insurance cost, current charge, and maximum allowable shipping cost.

2. **Adds, Deletes, and Updates Shipping Insurance Fee**

    After validating the parameters, it adds, deletes, or updates the charge depending on what mode it is in.

3. **Sends status code and message, and error status code and message**

    It returns an array of JSON objects. Each object has a status code and a status message. If there is no error with validation, then the array only contains one object. It's only when there is an error that there is more than one object. The reason it always returns an array is to allow `ups-dv-toggle-handler.js` to handle the response data in a single method rather than two separate methods (one for a single object and another for an array of objects).

    If a status code starts with S, it indicates that the request was successful. If it starts with an E, then that indicates that there was an error with the request. The message clearly states what the api page did or what went wrong with your request.  

    Below is a list of all possible responses. 

    ```js

        // SUCCESSFUL CASES

        [{
            status_code: 'S1',
            message : 'Charge Added Successfully'
        }]

        [{
            status_code: 'S2',
            message : 'Charge Removed Successfully'
        }]

        [{
            status_code: 'S3',
            message : 'Charge Updated Successfully'
        }]

        // UNSUCCESSFUL CASES

        [{
            status_code: 'E0',
            message : 'ERROR - Charge Must Be Greater Than 0'
        }]

        [{
            status_code: 'E1',
            message : 'ERROR - Subtotal too large. Contact Sales for insurance options.'
        }]

        [{
            status_code: 'E2',
            message : 'ERROR - Current charge is less than 0. Charge Deleted.'
        }]

        [{
            status_code: 'E3',
            message : 'ERROR - Invalid Request Mode'
        }]

        [{
            status_code: 'E4',
            message : 'ERROR - Missing One Or More Request Parameters'
        }]

        // CATCH-ALL ERROR MESSAGE
        [{
            status_code : "Unknown Error",
            message : "Unexpected Error"
        }]

    ```

4. **Debug Mode**

The is a debug mode if you pass through `debug=1` as a URL parameter. It returns all validation checks and their values in an object. It would look like this;

```js
    {
    "rqst_params_isvalid": &mvtj:rqst_params_isvalid;,
    "ship_cost_isvalid": &mvtj:ship_cost_isvalid;,
    "current_charge_isvalid": &mvtj:current_charge_isvalid;,
    "rqst_mode_isvalid": &mvtj:rqst_mode_isvalid;
    }
```

### PREACTION_OPAY.mv

**Some background on PreActions, PostActions, and Actions**

PreAction and PostAction commands are from the PCI NET Tool Belt Module for Miva Merchant. PreActions run before the standard Miva Merchant actions. PostActions run after the standard Miva Merchant actions. They can be used to validate data, add charges, etc. If there are any errors in the PreAction, you can set error codes and return to the original page.  Miva actions are directives that tell the Miva Merchant what to do. Their identifiers are 4 letters long and are invoked by submitting a form or by a URL parameter. In our case, we will use a form on OSEL to send the shipping insurance cost and shipping method to the PreAction page (See Template Changes for OSEL). The PreAction page will process this information and will add a shipping insurance charge or not, depending on what the customer chose, and move on to the standard Miva Merchant Actions.

**Further Reading**

If you want more information on PreActions, you can go to any Page on the Miva Merchant Admin, click the 'Tool Belt' tab. This has the most complete documentation about everything you can do with the PCI NET Tool Belt Module. If you are not an admin on the store, you may not be able to see this section. The next best thing is the documentation on [PCI NET's website](https://www.pcinet.com/docs/toolbelt_5.4_preview.html). 


If you want more information on Miva Merchant Actions, here is [Miva's Official Documentation](https://docs.miva.com/developer/developer-training/development-foundation/actions/)

There are examples on the website's Admin that you can look up as well. Simply search 'preaction' in the "Template Search And Replace". That can be found in  Settings > Utilities > Template Search And Replace.

**Where should this be added on the website?**

This should be added as a Page with Code = `PREACTION_OPAY`.

**What does this file do?**

1. **Adds Charge**

2. **Checks If Local Shipping is Selected**

    If Local pick-up is selected, then it will not add a shipping insurance charge.

---

## Template Code Changes

### Global header

The `UPS_DECLARED_VALUE_MACHINE` component must be called in the global header so that its variables are available whenever you need them. Simply add this to your global header.

```xml
<mvt:item name="readytheme" param="contentsection( 'ups_dv_machine' )" />
```

### BASK

1. **Add UPS_DECLARED_VALUE_MACHINE to the AJAX conditional block**

When a customer adds a product to their cart, it sends an AJAX request to the BASK page using `ajax-add-to-cart.js` (which could be found in the JavaScript resources). BASK doesn't return the whole page in this request because the request is made with a URL parameter of `AJAX=1`. BASK has a conditional block that checks for this parameter and only returns what is in that conditional block. After the PROD page receives this data, it uses it to populate the mini-basket and then opens the mini-basket. We have to call the `UPS_DECLARED_VALUE_MACHINE` component here too because the global header isn't loaded in the AJAX conditional block, meaning that the page doesn't have access to the variables from `UPS_DECLARED_VALUE_MACHINE.mv`.


```xml
<mvt:if expr="g.ajax EQ 1">
    <mvt:item name="html_profile" />
    <head>
    <mvt:comment> <!-- ---------------------------------------- Here is the call for UPS_DECLARED_VALUE_MACHINE.mv ---------------------------------------------- --> </mvt:comment>
        <mvt:item name="readytheme" param="contentsection( 'ups_dv_machine' )" />
        <meta charset="utf-8">
    </head>
    <body id="js-&mvte:page:code;">
        <mvt:item name="readytheme" param="contentsection( 'mini_basket' )" />
    </body>
    </html>
    <mvt:exit>
</mvt:if>
```

2. **Add toggle switch**

I place the toggle switch above the "Save Cart For Later" button. This is a stylistic choice, and you can move it or change the appearance to wherever you see fit. As long as you make the call to the toggle switch, it will work.

```xml
<mvt:if expr="l.settings:ship_ins_cost GT 0 AND l.settings:ship_ins_cost LE l.settings:UPS_DV_max_charge" >
<div class="o-layout o-layout-column u-border-rounded u-border-gray-50 u-width-4--l u-width-12" style="padding: 15px;border-radius: 1em;box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px; margin:1rem; background-color: lightblue;">
    <div class="o-layout__item">
        <div class="o-layout o-layout--justify-around o-layout--align-center">
            <div class="o-layout__item">
                <span class="u-text-bold u-font-small">Add Shipping Protection ($&mvt:ship_ins_cost;)</span>
            </div>
            <div class="o-layout__item">
        <mvt:item name="readytheme" param="contentsection( 'ups_decl_val_toggle' )" />
            </div>
        </div>
    </div>
    <div class="o-layout__item"  style="line-height: 1;">
        <span class="u-font-small">Protect your order! Carriers only cover $100. Fee is calculated based on order subtotal. <a class="u-color-blue u-text-bold" data-mini-modal="" data-mini-modal-type="inline" data-mini-modal-content="data-declared-value-estimator" href="" aria-label="Estimate UPS Declared Value Fee" id="miniModal_1">Learn More</a> <br><br> Do NOT add if you want to pick up your order in-store. </span></span>
    </div>
</div>
</mvt:if>	
```

3. **Add Placeholder Line Item**

When the charge is not active, BASK does not populate the line item element, so we must put a hidden placeholder that can be updated by `ups_dv-toggle-handler.js`.

```xml
    <mvt:if expr="l.settings:ship_ins_isactive EQ 0">
                            <tr class="c-table-simple__row u-color-gray-30 shipInsLineItem u-hidden-important">
                                <td class="c-table-simple__cell c-table-simple__cell--standard u-flex o-layout--justify-between">
                                <span>Shipping Protection</span>
                                <span class="shipInsLineItemVal"></span>
                                </td>
                            </tr>
    </mvt:if>
```

4. **Add Identifiers to Elements that will be updated**

We must add identifiers to the elements in the page that will be updated with `ups_dv-toggle-handler.js`. These will be the line item container, the line item value display, and the order total display. I decided to use class identifiers in case you wanted to place the toggle switch in more locations than the existing ones. 

```xml
<!-- For line item container and line item value display (class names are shipInsLineItem and shipInsLineItemVal, respectively.) This case is for when shipping insurance is NOT active. -->
<mvt:if expr="l.settings:ship_ins_isactive EQ 0">
    <tr class="c-table-simple__row u-color-gray-30 shipInsLineItem u-hidden-important">
        <td class="c-table-simple__cell c-table-simple__cell--standard u-flex o-layout--justify-between">
        <span>Shipping Protection</span>
        <span class="shipInsLineItemVal"></span>
        </td>
    </tr>
</mvt:if>

<!-- For line item container and line item value display (class names are shipInsLineItem and shipInsLineItemVal, respectively.) This case is for when shipping insurance is active. -->
<mvt:foreach iterator="charge" array="basket:charges">
    <mvt:if expr="l.settings:charge:type EQ 'SHIPPING_INSURANCE'">
        <tr class="c-table-simple__row u-color-gray-30 shipInsLineItem">
            <td class="c-table-simple__cell c-table-simple__cell--standard u-flex o-layout--justify-between">
                <span>&mvt:charge:descrip;</span>
                <span class="shipInsLineItemVal">&mvt:charge:formatted_disp_amt;</span>
            </td>
    <mvt:else>
        <tr class="c-table-simple__row u-color-gray-30">
            <td class="c-table-simple__cell c-table-simple__cell--standard u-flex o-layout--justify-between">
                <span>&mvt:charge:descrip;</span>
                <span>&mvt:charge:formatted_disp_amt;</span>
            </td>
    </mvt:if>
        </tr>
</mvt:foreach>

<!-- Order total display (class name is 'orderTotal') -->

<span class="orderTotal">&mvt:basket:formatted_total;</span>

```

### ORDL

1. **Add Toggle Switch**

This page only needs a toggle switch for it to be functional. The toggle switch element is very similar to what you see in BASK, but because it is inside of a flex box, the u-width classes have to be different to compensate. UI will only display the added charge in the minibasket. The order summary is visible once you either go to the next page or use the PayPal buttons.

```xml
<mvt:if expr="l.settings:ship_ins_cost GT 0 AND l.settings:ship_ins_cost LE l.settings:UPS_DV_max_charge" >
    <div class="o-layout o-layout-column u-border-rounded u-border-gray-50 u-width-10--l u-width-12" style="padding: 15px;border-radius: 1em;box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px; margin:1rem; background-color: lightblue;">
        <div class="o-layout__item">
            <div class="o-layout o-layout--justify-around o-layout--align-center">
                <div class="o-layout__item">
                    <span class="u-text-bold u-font-small">Add Shipping Protection ($&mvt:ship_ins_cost;)</span>
                </div>
                <div class="o-layout__item">
            <mvt:item name="readytheme" param="contentsection( 'ups_decl_val_toggle' )" />
                </div>
            </div>
        </div>
        <div class="o-layout__item"  style="line-height: 1;">
            <span class="u-font-small">Protect your order! Carriers only cover $100. Fee is calculated based on order subtotal. <a class="u-color-blue u-text-bold" data-mini-modal="" data-mini-modal-type="inline" data-mini-modal-content="data-declared-value-estimator" href="" aria-label="Estimate UPS Declared Value Fee" id="miniModal_1">Learn More</a>  <br><br> Do NOT add if you want to pick up your order in-store.</span></span>
        </div>
    </div>
</mvt:if>

```
### Global Mini-Basket Template
    
1. **Add Toggle Switch**

I added a very simple version of the toggle switch element. Like the other ones, this doesn't appear unless the shipping insurance cost is in the allowable range. This switch also serves as the line item. 

```xml
<mvt:if expr="l.settings:ship_ins_cost GT 0 AND l.settings:ship_ins_cost LE l.settings:UPS_DV_max_charge" >
    <div class="x-mini-basket__charges">
        <div class="x-mini__charge-item">
            <span class="u-text-bold">Add Shipping Protection ($&mvt:ship_ins_cost;) &nbsp;:&nbsp;<mvt:item name="readytheme" param="contentsection( 'ups_decl_val_toggle' )" /></span>
        </div>
    </div>
</mvt:if>
```

2. **Remove the Shipping Insurance Line item**

As stated before, the toggle switch serves as a line item for the mini-basket, so we must remove the normal one.

```xml
<div class="x-mini-basket__charges">
    <mvt:foreach iterator="charge" array="global_minibasket:charges">
        <mvt:if expr="l.settings:charge:type NE 'SHIPPING_INSURANCE' ">
        <div class="x-mini-basket__charge-item">
            <span class="u-text-uppercase">&mvt:charge:descrip;</span>
            <span>&mvt:charge:formatted_disp_amt;</span>
        </div>
        </mvt:if>
    </mvt:foreach>
</div>
```

3. **Add order total identifier**

This has the same class identifier as the one in BASK

```xml
<span class="u-text-bold orderTotal">&mvt:global_minibasket:formatted_total;</span>
```

### OSEL

1. **Add the PreAction to this page's form**

Note that the value of the PreAction must match the Page Code for the PreAction page.

```xml
    <form method="post" action="&mvte:urls:OPAY:secure;">
        <fieldset>
            <legend>&mvt:page:name;</legend>
            <mvt:item name="tax" />
            <input type="hidden" name="PreAction" value="PREACTION_OPAY" />
            <input type="hidden" name="Action" value="SHIP,PSHP,CTAX" />
```

2. **Add Shipping Insurance section.**

This section should only appear if the shipping insurance cost is within the allowable range. If the shipping insurance cost exceeds the maximum, it tells the customer to contact sales if they want to purchase insurance/protection for their shipment.

```xml
    <mvt:if expr="l.settings:ship_ins_cost GT 0 AND l.settings:ship_ins_cost LE l.settings:UPS_DV_max_charge">
    <br>
        <p class="c-heading-echo u-text-bold u-text-uppercase">
            Opt in for UPS Declared Value Protection <span class="c-heading--subheading">(Recommended)</span>
            <br>
            <span style="font-weight: 100; text-transform: none;">Without insurance on your packages/cargo shipments, carriers will only cover up to $100 in value. In the event of damage or loss during transit, carriers may limit their liability. We strongly recommend that you insure your goods. Please note that [Company name] is not responsible for covering any additional damages or expenses in the unfortunate event of the carrier losing your packages/cargo shipments.</span>
        </p>
                <ul class="c-form-list">
                    <mvt:if expr="g.ship_ins_err_message">
                    <li class="c-form-list__item c-form-list__item--full x-messages x-messages--error">&mvt:global:ship_ins_err_message;</li>
                    </mvt:if>
                                <li class="c-form-list__item c-form-list__item--full u-font-small">
                                <label class="c-form-checkbox c-form-checkbox--radio" title="Shipping Insurance" title="ShippingInsurance">
                                    <input class="c-form-checkbox__input" type="radio" name="ShippingInsurance" value="&mvte:ship_ins_cost;" required <mvt:if expr="l.settings:ship_ins_isactive">checked</mvt:if>>
                                            <span class="c-form-checkbox__caption o-layout o-list-inline o-layout--align-baseline u-flex">
                                                <span class="o-list-inline__item">Opt in</span>
                                                <span class="o-list-inline__item o-layout--grow">
                                                    <span class="c-keyline c-keyline--small u-block"></span>
                                                </span>
                                                <span class="o-list-inline__item">$&mvte:ship_ins_cost;</span>
                                            </span>
                                </label>
                            </li>

                                <li class="c-form-list__item c-form-list__item--full u-font-small">
                                <label class="c-form-checkbox c-form-checkbox--radio" title="Shipping Insurance" title="ShippingInsurance">
                                    <input class="c-form-checkbox__input" type="radio" name="ShippingInsurance" value="0" required>
                                            <span class="c-form-checkbox__caption o-layout o-list-inline o-layout--align-baseline u-flex">
                                                <span class="o-list-inline__item">Opt out</span>
                                                <span class="o-list-inline__item o-layout--grow">
                                                    <span class="c-keyline c-keyline--small u-block"></span>
                                                </span>
                                                <span class="o-list-inline__item">$0.00</span>
                                            </span>
                                </label>
                            </li>
                        </ul>
                        <br>
    <mvt:elseif expr="l.settings:ship_ins_cost GT l.settings:UPS_DV_max_charge">
    <br>
        <p class="c-heading-echo u-text-bold u-text-uppercase">
        UPS Declared Value Protection
        </p>
        <div class="x-messages x-messages--error">
            Your basket subtotal exceeds the UPS Maximum Declared Value! Please contact us for alternative insurance/protection options for your order.
            <br><br><br>
            <strong>Phone: 123-456-7890</strong>
            <br>
            <strong>Email: sales@mydomain.com</strong>
            <br>
            M-F 8:30 am - 5:30 pm PST
        </div>
    <mvt:else>
    </mvt:if>
```

## Shortcomings

1. **Customer's intent to purchase insurance does NOT persist** 

The current implementation of shipping insurance is entirely dependent on whether the shipping insurance charge exists in the customer's basket. It does not persist the customer's intent to purchase insurance if that charge is removed.

For example, a customer adds four items priced at $100 each, totaling $400, and chooses to add shipping insurance. Later, they remove three items, reducing their total to $100. Since this amount falls below the threshold for insurable orders, the insurance charge is automatically removed. If the customer then adds another item, bringing the total to $200, back within the eligible range, the system does not re-add the insurance charge, because it no longer remembers that the customer had previously opted in. This means the customer would have to manually reselect insurance.

2. **It's possible that a customer may opt in to shipping insurance when it's not completely necessary.**

Shipping insurance is not meant for Local pickup. A customer can opt for shipping insurance before choosing their shipping method. This is fine if the customer goes through the standard MIVA checkout because `PREACTION_OPAY` checks the shipping method and deletes the charge if it detects that local pick-up is selected. This is not the case if the customer checks out using the PayPal buttons. It is stated in the toggle element not to select opt in for insurance if they are picking up locally, but the possibility is still there.