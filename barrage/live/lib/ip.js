function is_valid(ip) {
    var reg = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
    if (reg.test(ip))
        return true;
    return false;
}
function get_region(pool, socket, ip) {
    if (ip.includes('::ffff:')) {
        ip = ip.substr(7);
    }
    if (pool == null) {
        console.error('mysql pool object is invalid');
        return ;
    }
    if (!is_valid(ip)) {
        console.error('wrong ip address: ' + ip);
        return;
    }
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log(err);  
            return;
        } 
        var sql = 'select * from ip_table where inet_aton(?) >= start_ip' +
                  ' and inet_aton(?) <= end_ip';
        conn.query(sql, [ip, ip], function(err, rows) {
            if (err) {
                console.log(err);  
                conn.release();
                return;
            }
            if (rows != null) {
                if (typeof rows[0].country != 'undefined') {
                    if (rows[0].country_id != 'CN')
                        socket.emit('client_region', rows[0].country);
                    else if (rows[0].country_id == 'CN' && typeof rows[0].city != 'undefined')
                        socket.emit('client_region', rows[0].city);
                    else 
                        socket.emit('client_region', '本地');       
                } else 
                    socket.emit('client_region', '未知');       
            } else {
                console.log('ip connot judge region');
                socket.emit('client_region', '未知');       
            }
            conn.release();
        });
    });
}

module.exports = get_region;
