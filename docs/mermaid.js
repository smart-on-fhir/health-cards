        var config = {
            startOnLoad:true,
            htmlLabels:true,
            callback:function(id){
                console.log(id,' rendered');
            },
            sequenceDiagram:{
                    useMaxWidth:false,
                }
        };
        mermaid.initialize(config);
