window.api.invoke('myfunc', [1,2,3])
    .then(function(res) {
        console.log(res); // will print "This worked!" to the browser console
    })
    .catch(function(err) {
        console.error(err); // will print "This didn't work!" to the browser console.
    });