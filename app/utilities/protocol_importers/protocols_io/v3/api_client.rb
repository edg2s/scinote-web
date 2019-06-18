# frozen_string_literal: true

module ProtocolImporters
  module ProtocolsIO
    module V3
      class ApiClient
        include HTTParty

        CONSTANTS = Constants::PROTOCOLS_IO_V3_API

        base_uri CONSTANTS[:base_uri]
        default_timeout CONSTANTS[:default_timeout]
        logger Rails.logger, CONSTANTS[:debug_level]

        attr_reader :errors

        def initialize(token = nil)
          # Currently we support public tokens only (no token needed for public data)
          @auth = { token: token }
          @errors = {}

          # Set default headers
          self.class.headers('Authorization': "Bearer #{@auth[:token]}") if @auth[:token].present?
        end

        # Query params available are:
        #   filter (optional): {public|user_public|user_private|shared_with_user}
        #     Which type of protocols to filter.
        #     default is public and requires no auth token.
        #     user_public requires public token.
        #     user_private|shared_with_user require private auth token.
        #   key (optional): string
        #     Search key to search for in protocol name, description, authors.
        #     default: ''
        #   order_field (optional): {activity|date|name|id}
        #     order by this field.
        #     default is activity.
        #   order_dir (optional): {desc|asc}
        #     Direction of ordering.
        #     default is desc.
        #   page_size (optional): int
        #     Number of items per page.
        #     Default 10.
        #   page_id (optional): int (1..n)
        #     id of page.
        #     Default is 1.
        def protocol_list(query_params = {})
          query = CONSTANTS.dig(:endpoints, :protocols, :default_query_params)
                           .merge(query_params)

          check_for_api_errors(self.class.get('/protocols', query: query))
        end

        # Returns full representation of given protocol ID
        def single_protocol(id)
          check_for_api_errors(self.class.get("/protocols/#{id}"))
        end

        # Returns html preview for given protocol
        # This endpoint is outside the scope of API but is listed here for the
        # sake of clarity
        def protocol_html_preview(uri)
          self.class.get("https://www.protocols.io/view/#{uri}.html", headers: {})
        end

        private

        def check_for_api_errors(response)
          if response['status_code'] == 0
            return response
          elsif response['status_code'] == 1
            raise ApiErrors::MissingOrEmptyParametersError.new(response['status_code'], response['error_message'])
          elsif response['status_code'] == 1218
            raise ApiErrors::InvalidTokenError.new(response['status_code'], response['error_message'])
          elsif response['status_code'] == 1219
            raise ApiErrors::TokenExpiredError.new(response['status_code'], response['error_message'])
          else
            raise ApiErrors::Error.new(response['status_code'], response['error_message'])
          end
        end
      end
    end
  end
end
