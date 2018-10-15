import Component from '@ember/component';
import { set, get } from '@ember/object';
import { inject as service } from '@ember/service';
import layout from './template';

export default Component.extend({
  intl:        service(),
  scope:       service(),
  globalStore: service(),

  layout,

  duration: null,
  lines:    [],

  cpuFields:           ['cpuUsage'],
  memoryFields:        ['memoryUsage'],
  memoryPageFields:    ['memoryPageIn', 'memoryPageOut'],
  diskFields:          ['diskUsage'],
  networkPacketFields: ['networkTranPacket', 'networkRevPacket', 'networkTranError', 'networkRevError', 'networkTranDrop',   'networkRevDrop'],
  storageFields:       ['storageWrite', 'storageRead'],
  networkFields:       ['networkRevTotal', 'networkTranTotal'],
  loadFields:          ['load5'],

  loading: false,
  stats:   null,

  actions: {
    query(options){
      const clusterId = get(this, 'scope.currentCluster.id');

      set(this, 'loading', true);

      get(this, 'globalStore').rawRequest({
        url:    `clusters/${ clusterId }/hoststats?${ options.query }`,
        method: 'GET',
      })
        .then((xhr) => {
          if (this.isDestroyed || this.isDestroying) {
            return;
          }

          set(this, 'stats', {});
          const data = JSON.parse(xhr.body);

          get(this, 'lines').clear();
          data.forEach((node) => {
            const series = get(node, 'series');
            const nodeId = get(node, 'id');

            this.updateData(series, nodeId);
          });
        }).finally(() => {
          if (this.isDestroyed || this.isDestroying) {
            return;
          }

          set(this, 'stats.needRefresh', true);
          set(this, 'loading', false);
          options.cb();
        });
    }
  },

  updateData(series, nodeId) {
    const found = get(this, 'nodes').findBy('id', nodeId);
    const line = {
      id:   found ? get(found, 'displayName') : nodeId,
      data: {},
    };

    get(this, 'lines').push(line);
    series.forEach((serie) => {
      const name = get(serie, 'name');
      const points = get(serie, 'points');

      switch (name){
      case 'node_cpu_usage_seconds_sum_rate':
        set(line, 'data.cpuUsage', points.map((p) => [p[0] * 100, p[1]]));
        break;
      case 'node_memory_usage_percent':
        set(line, 'data.memoryUsage', points.map((p) => [p[0] * 100, p[1]]));
        break;
      case 'node_memory_page_in_bytes_sum_rate':
        set(line, 'data.memoryPageIn', points.map((p) => [p[0] / 1024, p[1]]));
        break;
      case 'node_memory_page_out_bytes_sum_rate':
        set(line, 'data.memoryPageOut', points.map((p) => [p[0] / 1024, p[1]]));
        break;
      case 'node_fs_usage_percent':
        set(line, 'data.diskUsage', points.map((p) => [p[0] * 100, p[1]]));
        break;
      case 'node_network_receive_bytes_sum_rate':
        set(line, 'data.networkRevTotal', points.map((p) => [p[0] / 1024, p[1]]));
        break;
      case 'node_network_receive_errors_sum_rate':
        set(line, 'data.networkRevError', points);
        break;
      case 'node_network_receive_packets_dropped_sum_rate':
        set(line, 'data.networkRevDrop', points);
        break;
      case 'node_network_receive_packets_sum_rate':
        set(line, 'data.networkRevPacket', points);
        break;
      case 'node_network_transmit_bytes_sum_rate':
        set(line, 'data.networkTranTotal', points.map((p) => [p[0] / 1024, p[1]]));
        break;
      case 'node_network_transmit_errors_sum_rate':
        set(line, 'data.networkTranError', points);
        break;
      case 'node_network_transmit_packets_dropped_sum_rate':
        set(line, 'data.networkTranDrop', points);
        break;
      case 'node_network_transmit_packets_sum_rate':
        set(line, 'data.networkTranPacket', points);
        break;
      case 'node_disk_io_reads_bytes_sum_rate':
        set(line, 'data.storageRead', points.map((p) => [p[0] / 1024, p[1]]));
        break;
      case 'node_disk_io_writes_bytes_sum_rate':
        set(line, 'data.storageWrite', points.map((p) => [p[0] / 1024, p[1]]));
        break;
      case 'node_cpu_load_5':
        set(line, 'data.load5', points);
        break;
      }
    })
  }
});
