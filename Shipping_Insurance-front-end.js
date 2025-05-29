function handleDivToggleClick(divToggle) {
  if (divToggle.classList.contains('loading')) return;

  divToggle.classList.add('loading');

  setTimeout(function () {
    const shippingCost = parseFloat(divToggle.dataset.shipping_cost);
    const currentCharge = parseFloat(divToggle.dataset.current_charge);
    const rqstMode = divToggle.dataset.rqst_mode;

    const shipInsLineItems = document.querySelectorAll('.shipInsLineItem');
    const shipInsLineItemVals = document.querySelectorAll('.shipInsLineItemVal');
    const currentBasketTotalElems = document.querySelectorAll('.orderTotal');
    const currentBasketTotalVal = parseFloat(divToggle.dataset.current_total);

    const url = "/shipping-insurance-api.html?ship_insurance_cost=" + shippingCost +
                "&current_charge=" + currentCharge +
                "&rqst_mode=" + rqstMode +
                "&ajax=1";

    fetch(url, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data[0].status_code.includes("E")) {
        console.error('INVALID REQUEST:', data);
      } else {
        console.log('Response:', data);

        let newCurrentBalance;

        if (rqstMode === 'add' || rqstMode === 'update') {
          newCurrentBalance = currentBasketTotalVal + shippingCost;

          document.querySelectorAll('.divToggle').forEach(toggle => {
            toggle.dataset.rqst_mode = 'delete';
            toggle.dataset.current_total = newCurrentBalance;
            toggle.dataset.current_charge = shippingCost;
          });

          currentBasketTotalElems.forEach(el => {
            el.innerHTML = `$${newCurrentBalance.toFixed(2)}`;
          });

          shipInsLineItems.forEach((item, index) => {
            item.classList.remove('u-hidden-important');
            shipInsLineItemVals[index].innerHTML = `$${shippingCost.toFixed(2)}`;
          });

        } else {
          newCurrentBalance = currentBasketTotalVal - shippingCost;

          document.querySelectorAll('.divToggle').forEach(toggle => {
            toggle.dataset.rqst_mode = 'add';
            toggle.dataset.current_total = newCurrentBalance;
            toggle.dataset.current_charge = 0;
          });

          currentBasketTotalElems.forEach(el => {
            el.innerHTML = `$${newCurrentBalance.toFixed(2)}`;
          });

          shipInsLineItems.forEach((item, index) => {
            item.classList.add('u-hidden-important');
            shipInsLineItemVals[index].innerHTML = '';
          });
        }

        document.querySelectorAll('.divToggle').forEach(toggle => {
          toggle.classList.toggle('active');
        });
      }
    })
    .catch(error => {
      console.error('Error:', error);
    })
    .finally(() => {
      divToggle.classList.remove('loading');
    });
  }, 250);
}

// Direct click binding (for statically loaded elements)
document.querySelectorAll('.divToggle').forEach(divToggle => {
  divToggle.addEventListener('click', function () {
    handleDivToggleClick(this);
  });
});

// Delegated event binding (for dynamically added elements inside #dynamic-wrapper)
document.querySelector('[data-hook="mini-basket"]').addEventListener('click', function (e) {
  let toggle = e.target.closest('.divToggle');
  if (toggle) {
    handleDivToggleClick(toggle);
  }
});
