# Common API

In this documentation, we will focus on the common API. This module includes the core of BatchJS. This API allows you to create your own custom jobs and steps using the common interface.

------------

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [SqliteBatchEntityReader](#sqlitebatchentityreader)
  - [SqliteBatchEntityWriter](#sqlitebatchentitywriter)

## SqliteBatchEntityReader

`extends AbstractBatchEntityReaderStream` 

Class that read data in batches of a specified size in SQLite databases.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the SqliteBatchEntityReader. | SqliteBatchEntityReaderOptions |
  | **options.dbConnectionFactory** | Function that creates a database connection. | function |



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

Destroys the writer by finalizing the statement used to read entities and
closing the database connection. This method should be called when the
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
  | Promise.&lt;sqlite.Database&gt; | A promise that resolves with the database connection. |


### disconnectDatabase (function)



Disconnects from the database by closing the active database connection
and setting the connection reference to null. This method should be called
when the reader is no longer needed to free up resources.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the database connection
is successfully closed. |


### prepareStatement (function)

`private` 

Prepares a statement for fetching entities. If the statement has already been
prepared, it is reused.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **db** | The database connection. | sqlite.Database |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;sqlite.Statement&gt; | The prepared statement. |


### finalizeStatement (function)

`private` 

Finalizes the statement used to fetch entities. This method should be
called when the reader is no longer needed to free up resources.


## SqliteBatchEntityWriter

`extends AbstractBatchEntityWriterStream` 

Class that write data in batches of a specified size in SQLite databases.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the SqliteBatchEntityWriter. | SqliteBatchEntityWriterOptions |
  | **options.dbConnectionFactory** | Function that creates a database connection. | function |



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


### executeBatch (function)

`private` 

Executes a batch of data in the database, commits the transaction if all
promises are resolved, or rolls back the transaction if any of the promises
are rejected.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **db** | The database connection. | sqlite3.Database |
  | **chunk** | The batch of data to write to the storage. | BatchData.&lt;T&gt; |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;Array.&lt;void&gt;&gt; | A promise that resolves when all promises are resolved. |


### commitTransaction (function)

`private` 

Commits the transaction if no errors occurred during the batch execution.
If an error occurred, the transaction is rolled back and the error is propagated.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **db** | The database connection. | sqlite.Database |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the transaction is committed. |


### rollbackTransaction (function)

`private` 

Rolls back the transaction if an error occurred during the batch execution.
The error is propagated to the caller.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **db** | The database connection. | sqlite.Database |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the transaction is rolled back. |


### prepareStatement (function)

`private` 

Prepares a statement for saving entities. If the statement has already been
prepared, it is reused.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **db** | The database connection. | sqlite.Database |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;sqlite.Statement&gt; | The prepared statement. |


### finalizeStatement (function)

`private` 

Finalizes the statement used to save entities. This method should be
called when the writer is no longer needed to free up resources.


### _final (function)

`private` 

Finalizes the writer by calling the _final method of the superclass and
finalizing the statement used to save entities. This method should be
called when the writer is no longer needed to free up resources.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the writer. | WriteCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; |  |


