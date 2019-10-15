var spawn = require('cross-spawn'),
    fs = require('fs'),
    fetch = require('node-fetch');

function command(ins, outs, config, cb) {
    var exec = config.executor.executable,
        args = config.executor.args;

    var stdoutStream;

    console.log("Executing:", exec, args);

//    var proc = spawn(exec, [ args ]);
    var proc = spawn(exec,  args );

    if (config.executor.stdout) {
        stdoutStream = fs.createWriteStream(config.executor.stdout, {flags: 'w'});
        proc.stdout.pipe(stdoutStream);
    }

    proc.stdout.on('data', function(data) {
        console.log(exec, 'stdout:' + data);
    });

    proc.stderr.on('data', function(data) {
        console.log(exec, 'stderr:' + data);
    });

    proc.on('exit', function(code) {
        console.log(exec, 'exiting with code:' + code);
        cb(null, outs);
    });

    proc.on('close', function (code, signal) {
        console.log(exec, 'terminated due to receipt of signal '+signal);
    });
}

function command_print(ins, outs, config, cb) {
    var exec = config.executor.executable,
        args = config.executor.args.join(' ');

    setTimeout(function() {
        console.log(exec, args);
        cb(null, outs);
    }, 1);
}

function command_simulate(ins, outs, config, cb) {
    const host = 'http://0.0.0.0:8080/execute';
    const body = {
        workflowId: config.appId,
        hyperflowId: config.hfId,
        procId: config.procId,
        name: config.name,
        executor: config.executor,
    };

    fetch(host, {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
        if (res.status == 200) {
            console.log('ok')
            cb(null, outs)
        }
    }).catch(err => {
        console.log({err})
        cb(err, outs)
    })
}

function command_notifyevents(ins, outs, config, cb) {
    var exec = config.executor.executable,
        args = config.executor.args;

    var eventServer = config['eventServer'];
    if(typeof eventServer !== 'undefined' && eventServer) {
        eventServer.emit("trace.job", exec, args);
    } else {
        console.log("loged: " + exec, args);
    }
    cb(null, outs);
}


exports.command = command;
exports.command_print = command_print;
exports.command_simulate = command_simulate;
exports.command_notifyevents = command_notifyevents;
