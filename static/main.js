document.addEventListener('DOMContentLoaded', () =>{

    username = document.querySelector('#display-name').innerHTML;
    localStorage.setItem('username', username);

    function setChannelLink(){
        document.querySelectorAll('.channel-link').forEach(link => {
            link.onclick = ()=> {
                load_channel(link.dataset.channel);
                return false;
            }
        });
    }

     $('.modal').on('shown.bs.modal', function() {
        $(this).find('[autofocus]').focus();
    });
    

    
    const activeChannel = localStorage.getItem('activeChannel');


    var load_prev = false;
    Array.from(document.querySelectorAll('#channels>li'), li => {
    if (li.textContent == activeChannel)
        load_prev = true;
    return load_prev
    });


    
    if (load_prev)
        load_channel(activeChannel);
    else
        load_channel('general');


    
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    
    document.querySelector("#create-channel-button").disabled = true;

    
    document.querySelector("#channel").onkeyup = () => {
        if (document.querySelector('#channel').value.length > 0 && localStorage.getItem('taken') != document.querySelector("#channel").value){
            var letterNumber = /^[0-9a-zA-Z]+$/;
            
            if(document.querySelector('#channel').value.match(letterNumber)){
                document.querySelector("#create-channel-button").disabled = false;
            } else
                document.querySelector("#create-channel-button").disabled = true;
        } else
            document.querySelector("#create-channel-button").disabled = true;
    }

    document.querySelector('#send').disabled = true;
    document.querySelector('#msg').onkeyup = () => {
        if (document.querySelector('#msg').value.length > 0)
            document.querySelector('#send').disabled = false;
        else
            document.querySelector('#send').disabled = true;

    }

   
    const messages = document.querySelector('#msgs');

    
    function load_channel(channel) {
        setChannelLink();
        
        const request = new XMLHttpRequest();
        request.open('GET', `/channel/${channel}`);
        request.onload = () => {

           
            document.title = channel;

            
            localStorage.setItem('activeChannel', channel);

           
            document.querySelector('#msgs').innerHTML = '';

            document.querySelector("#channel-name").innerHTML = '#' + channel;

            
            const template = Handlebars.compile(document.querySelector("#conversations").innerHTML);
            var users_msgs = JSON.parse(request.responseText);

            // Add a deleteOption to delete the message send by the respective user, By default it's False 
           
            
            const content = template({'users_msgs': users_msgs});
             
            document.querySelector("#msgs").innerHTML += content;
            // Set the amount of vertical scroll equal to total container size 
            messages.scrollTop = messages.scrollHeight;
            SetDeleteButton();
        };
        request.send();
    }


    // Set up delete button when clicked, remove post.
    
    // When connected, configure form submit buttons
    socket.on('connect', () => {

        // Every time user submits a msg emit a "new msg" event
        document.querySelector('#msg-form').onsubmit = () => {
            const msg = document.querySelector('#msg').value;
            const username =  document.querySelector('#display-name').innerHTML;
            channel = localStorage.getItem('activeChannel');

            const today = new Date();
            const time = today.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true});

            socket.emit('new msg', {'msg': msg, 'username': username, 'channel': channel, 'dateTime': time});
            document.querySelector("#msg").value = "";
            return false;
        }

        
        document.querySelector('#create-channel-form').onsubmit = ()=> {
            const channel = document.querySelector('#channel').value;
            const username = document.querySelector('#display-name').innerHTML;
            socket.emit('new channel', {'channel': channel, 'username': username});
            return false;
        }

    });


    
    socket.on('announce message', data => {
        if (data.success){
            const template = Handlebars.compile(document.querySelector("#conversations").innerHTML);
            
            
            users_msgs = [[data.username, data.dateTime, data.msg, data.deleteOption]];
            const content = template({'users_msgs': users_msgs});
        
    
            if (localStorage.getItem('activeChannel') === data.channel){
                document.querySelector("#msgs").innerHTML += content;
                messages.scrollTop = messages.scrollHeight; 
            }
                
        } else{
            alert('You have reached max limit of messages');
        }
        
    });
    

    
    socket.on('announce channel', data => {
        if (data.success){
            // $('#addChannelModal').modal('delete');
            document.querySelector('#channel').value = '';

            // Template for channels
            const template = Handlebars.compile(document.querySelector('#result').innerHTML);
            const content = template({'channel': data.channel});
            document.querySelector('#channels').innerHTML += content;
            setChannelLink();
            location.reload();
            if (data.username === document.querySelector('#display-name').innerHTML){
                load_channel(data.channel);
            }
        } else{
            alert('Channel name already exists.')   
        }
        
    });
});