# Lava Board

### Simple Dashboard App using Deployd (nodejs)

```

var evtObj = {
    type:'standard',
    namespace:'review.created',
    data: {
        zip: '30338'
    }
};

dpd.event.post(evtObj, function(result, err) {
  if(err) return console.log(err);
  console.log(result, result.id);
});

```


