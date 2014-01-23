
if(typeof this.timestamp === 'undefined'){ 
    this.timestamp = new Date().getTime();
}

emit('event.post', this);
