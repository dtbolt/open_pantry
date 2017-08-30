export default function(channel){
  const intFromFindClass = (parent, className) => parseInt(parent.find(className).html(), 10)
  const getMaxAllowed    = (row) => parseInt(row.data('max-allowed'), 10)
  const getAvailable     = (row) => intFromFindClass(row, '.js-available-quantity')
  const getQuantity      = (row) => intFromFindClass(row, '.js-current-quantity')
  const getCost          = (row) => intFromFindClass(row, '.js-credit-cost')
  const getCredits       = (row) => intFromFindClass(row.parents('.js-stock-type'), '.js-credit-count')
  const getType          = (row) => row.parents('.js-stock-type').find('.js-credit-count').data('credit-type')
  const setUserQuantity  = (row, newQuantity) => row.find('.js-current-quantity').html(newQuantity)
  const setTotalQuantity = (row, newQuantity) => row.find('.js-available-quantity').html(newQuantity)
  const setCredits       = (row, newQuantity) => row.parents('.js-stock-type').find('.js-credit-count').html(newQuantity)
  var fn;
  let handlers = {
    "js-add-stock": function(row){
      const credits = getCredits(row);
      const cost    = getCost(row);
      if (getAvailable(row) > 0 && credits >= cost) {
        channel.push('request_stock', { id: row.data('stock-id'), quantity: 1, type: getType(row) });
        setUserQuantity(row, getQuantity(row) + 1);
        setCredits(row, credits - cost);
      }
      if (getQuantity(row) >= getMaxAllowed(row)) {
        $(row).find(".js-add-stock").prop("disabled",true)
        window.plus_button =  $(row).find(".js-add-stock").html();
        $(row).find(".js-add-stock").text(row.data("max-allowed-message"))
      }
    },
    "js-remove-stock": function(row){
      const currentQuantity = getQuantity(row)
      if (currentQuantity > 0) {
        const credits = getCredits(row);
        const cost    = getCost(row);
        channel.push('release_stock', { id: row.data('stock-id'), quantity: 1, type: getType(row) });
        setUserQuantity(row, currentQuantity - 1);
        setCredits(row, credits + cost);
      }
      if (getQuantity(row) < getMaxAllowed(row)) {
        $(row).find(".js-add-stock").prop("disabled",false)
        $(row).find(".js-add-stock").html(window.plus_button)
      }
    },
    "js-clear-stock": function(row){
      const currentQuantity = getQuantity(row)
      if (currentQuantity > 0) {
        const credits = getCredits(row);
        const cost    = getCost(row);
        channel.push('release_stock', { id: row.data('stock-id'), quantity: getQuantity(row), type: getType(row) });
        setUserQuantity(row, 0)
        setCredits(row, credits + cost * currentQuantity);
      }
    }
  }


  $('.js-stock-row').on('click', function(el){
    el.target.classList.forEach(function(className){
      if (fn = handlers[className]){
        fn($(el.currentTarget));
      }
    })
  })

  $('.js-add-cart').on('click', function(el){
    el.target.classList = el.target.classList + " hidden"
    $(el.target).parent().find(".js-quantity-control").removeClass("hidden")
  })

  channel.on('set_stock', payload => {
    const {id, quantity} = payload;
    setTotalQuantity($(`*[data-stock-id="${id}"]`), quantity);
  });

  channel.on('current_credits', payload => {
    $.each(payload, (type, credits) => $(`.js-${type}-credit-count`).find('.js-credit-count').html(credits) )
  });

  channel.on('order_update', payload => {
    $('.js-user-orders').prepend(payload.html)
  });

  channel.on('update_distribution', payload => {
    const {id, html} = payload;
    const $html = $(html)
    const existing = $('.js-cart').find(`*[data-stock-distribution-id="${id}"]`).first();
    const quantity = intFromFindClass($html, '.js-quantity-requested')

    if (existing.length && quantity > 0) {
      $(existing).html($html.html())
    } else if (existing.length && quantity == 0) {
      $(existing).remove()
    } else {
      $('.js-cart').find('.js-stock-list').append(html)
    }
  });

}
