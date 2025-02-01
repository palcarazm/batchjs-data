# Common API

In this documentation, we will focus on the common API. This module includes the core of BatchJS. This API allows you to create your own custom jobs and steps using the common interface.

------------

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [MysqlBatchEntityReader](#mysqlbatchentityreader)
  - [MysqlBatchEntityWriter](#mysqlbatchentitywriter)

## MysqlBatchEntityReader

`extends AbstractBatchEntityReaderStream` 

Class that reads data in batches of a specified size from a MySQL database.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the MysqlBatchEntityReader. | MysqlBatchEntityReaderOptions |
  | **options.pool** | The MySQL connection pool. | Pool |
  | **options.query** | SQL query to be executed (without LIMIT and OFFSET). | string |



### fetch (function)

`private` 

Fetches a batch of data from the database.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size of the batch to fetch. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;BatchData.&lt;T&gt;&gt; | A promise that resolves with the batch of data. |


### _destroy (function)

`private` 

Destroys the writer by closing the database connection. This method should be called when the
writer is no longer needed to free up resources.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **error** | The error that caused the destruction. | Error, null |
  | **callback** | The callback function to be executed after destroying the reader. | ReadCallback |


### connectDatabase (function)

`private` 

Connects to the database by creating a new database connection if none
already exists, or by reusing an existing connection.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;PoolConnection&gt; | A promise that resolves with the database connection. |


### disconnectDatabase (function)



Disconnects from the database by releasing the active database connection
and setting the client reference to null. This method should be called
when the reader is no longer needed to free up resources.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the database connection
is successfully released. |


## MysqlBatchEntityWriter

`extends AbstractBatchEntityWriterStream` 

Class that writes data in batches of a specified size into a MySQL database.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the MysqlBatchEntityWriter. | MysqlBatchEntityWriterOptions |
  | **options.pool** | The MySQL connection pool. | Pool |
  | **options.prepareStatement** | Insert SQL prepared statement to be executed. | String |



### batchWrite (function)

`protected` 

Writes a batch of data to the storage.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The batch of data to write to the storage. | BatchData.&lt;T&gt; |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the batch is successfully written.
The promise should be rejected if there is an error during writing. |


