        var config = {
            startOnLoad:true,
            htmlLabels:true,
            callback:function(id){
                console.log(id,' rendered');
            },
            sequence:{
                    useMaxWidth:false,
                }
        };
        mermaid.initialize(config);
