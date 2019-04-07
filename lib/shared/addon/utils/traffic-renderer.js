import EmberObject from '@ember/object';
import { get, set } from '@ember/object'
import Kiali from 'ui/utils/kiali';

const FRAME_RATE = 1 / 60;

const TrafficEdgeType = {
  RPS:  'RPS',
  TCP:  'TCP',
  NONE: 'NONE',
}

const CyEdge = {
  grpc:           'grpc',
  grpcErr:        'grpcErr',
  grpcPercentErr: 'grpcPercentErr',
  grpcPercentReq: 'grpcPercentReq',
  http:           'http',
  http3xx:        'http3xx',
  http4xx:        'http4xx',
  http5xx:        'http5xx',
  httpPercentErr: 'httpPercentErr',
  httpPercentReq: 'httpPercentReq',
  id:             'id',
  isMTLS:         'isMTLS',
  protocol:       'protocol',
  responseTime:   'responseTime',
  tcp:            'tcp'
};

export default EmberObject.extend({
  init() {
    this._super();
    console.log(get(this, 'cy'), 'cy-init')
  },

  stop() {
    const { animationTimer } = this

    if (animationTimer) {
      window.clearInterval(animationTimer);
      set(this, 'animationTimer', undefined)
      this.clear();
    }
  },

  start() {
    this.stop();
    set(this, 'animationTimer', window.setInterval(get(this, 'processStep'), FRAME_RATE * 1000))
  },

  setEdges(edges) {
    set(this, 'trafficEdges', this.processEdges(edges))
  },

  setEdge(edge) {
    set(this, 'edge', edge)
  },

  processEdges(edges) {
    return edges.reduce((trafficEdges, edge) => {
      const type = this.getTrafficEdgeType(edge);

      if (type !== TrafficEdgeType.NONE) {
        const edgeId = edge.data(CyEdge.id);

        if (edgeId in get(this, 'trafficEdges')) {
          trafficEdges[edgeId] = get(this, 'trafficEdges.edgeId');
        } else {
          // trafficEdges[edgeId] = new TrafficEdge();
        }
        trafficEdges[edgeId].setType(type);
        // this.fillTrafficEdge(edge, trafficEdges[edgeId]);
      }

      return trafficEdges;
    }, {});
  },

  getTrafficEdgeType(edge) {
    switch (edge.data(CyEdge.protocol)) {
    case Kiali.Protocol.GRPC:
    case Kiali.Protocol.HTTP:
      return TrafficEdgeType.RPS;
    case Kiali.Protocol.TCP:
      return TrafficEdgeType.TCP;
    default:
      return TrafficEdgeType.NONE;
    }
  },
});
